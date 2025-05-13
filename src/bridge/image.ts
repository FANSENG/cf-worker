// 导入 SDK, 当 TOS Node.JS SDK 版本小于 2.5.2 请把下方 TosClient 改成 TOS 导入
import { TosClient, TosClientError, TosServerError } from '@volcengine/tos-sdk';
// 导入Buffer类型，确保在Cloudflare Workers环境中可用
import { Buffer } from 'node:buffer';

// 从环境变量中获取配置，请确保在您的环境中设置了这些变量
const TOS_REGION = 'cn-beijing'; // 例如 'cn-beijing'
const TOS_ENDPOINT = 'tos-cn-beijing.volces.com'
const TOS_BUCKET_NAME = 'menus'

let client: TosClient | null = null;

function initializeTosClient(env: Env) {
  if (!client) {
    client = new TosClient({
      accessKeyId: env.TOS_ACCESS_KEY,
      accessKeySecret: env.TOS_SECRET_KEY,
      region: TOS_REGION,
      endpoint: TOS_ENDPOINT,
    });
  }
  return client;
}

/**
 * 处理TOS SDK相关的错误
 * @param error 错误对象
 */
function handleError(error: any) {
  if (error instanceof TosClientError) {
    console.error('TOS Client Error:', error.message);
    console.error('Stack:', error.stack);
    throw new Error(`TOS Client Error: ${error.message}`);
  } else if (error instanceof TosServerError) {
    console.error('TOS Server Error Request ID:', error.requestId);
    console.error('TOS Server Error Status Code:', error.statusCode);
    console.error('TOS Server Error Code:', error.code);
    console.error('TOS Server Error Message:', error.message);
    throw new Error(`TOS Server Error (${error.code}): ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
    throw new Error('An unexpected error occurred while interacting with TOS.');
  }
}

/**
 * 获取图片的预签名下载链接。
 * @param imagePath 图片在存储桶中的路径/名称 (key)
 * @returns 返回预签名的下载URL字符串
 * @throws 如果配置缺失或生成URL失败，则抛出错误
 */
export async function getPreSignedDownloadUrl(env: Env, imagePath: string): Promise<string> {
  if (!TOS_REGION || !TOS_ENDPOINT || !TOS_BUCKET_NAME) {
    console.error('Missing TOS configuration in environment variables.');
    throw new Error('TOS configuration is incomplete. Please check environment variables: TOS_ACCESS_KEY, TOS_SECRET_KEY, TOS_REGION, TOS_ENDPOINT, TOS_BUCKET_NAME.');
  }

  try {
    const url = initializeTosClient(env).getPreSignedUrl({
      method: 'GET', // 指定操作为下载
      bucket: TOS_BUCKET_NAME,
      key: imagePath,
      // expires: 3600, // 链接有效期，单位秒，默认为3600秒 (1小时)，可以按需调整
    });
    // console.log(`Successfully generated pre-signed URL for ${imagePath}: ${url}`);
    return url;
  } catch (error) {
    handleError(error); // 错误将在这里被捕获并重新抛出
    // 由于handleError会抛出错误，这里的return实际上不会执行，但为了类型符合性可以保留
    return ''; // 或者根据实际错误处理逻辑调整
  }
}

/**
 * 将Base64编码的图片数据上传到对象存储
 * @param env 环境变量，包含TOS访问密钥
 * @param imageData 图片数据, Base64编码
 * @returns 上传后的Key，通过 UUID 生成
 * @throws 如果配置缺失或上传失败，则抛出错误
 */
export async function uploadImageToStorage(env: Env, imageData: string): Promise<string> {
  if (!TOS_REGION || !TOS_ENDPOINT || !TOS_BUCKET_NAME) {
    console.error('Missing TOS configuration in environment variables.');
    throw new Error('TOS configuration is incomplete. Please check environment variables: TOS_ACCESS_KEY, TOS_SECRET_KEY, TOS_REGION, TOS_ENDPOINT, TOS_BUCKET_NAME.');
  }

  // 检查imageData是否为Base64格式
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('Invalid image data: Image data must be a non-empty string');
  }

  // 如果Base64字符串包含前缀（如data:image/jpeg;base64,），则移除前缀
  const base64Data = imageData.replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, '');
  
  // 在Cloudflare Workers环境中解码Base64
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  // 生成唯一的文件名（使用时间戳和随机字符串）
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const fileExtension = getFileExtensionFromBase64(imageData);
  const key = `images/${timestamp}-${randomString}.${fileExtension}`;
  
  try {
    // 初始化TOS客户端并上传文件
    const tosClient = initializeTosClient(env);
    
    await tosClient.putObject({
      bucket: TOS_BUCKET_NAME,
      key: key,
      body: imageBuffer,
      contentType: `image/${fileExtension}`,
    });
    
    console.log(`Successfully uploaded image to ${key}`);
    return key;
  } catch (error) {
    handleError(error);
    return ''; // 由于handleError会抛出错误，这里的return实际上不会执行
  }
}

/**
 * 从Base64图片数据中获取文件扩展名
 * @param base64Data Base64编码的图片数据
 * @returns 文件扩展名（不包含点）
 */
function getFileExtensionFromBase64(base64Data: string): string {
  // 检查是否包含MIME类型前缀
  if (base64Data.startsWith('data:image/')) {
    const mimeType = base64Data.split(';')[0].split(':')[1];
    // 从MIME类型中提取扩展名
    const extension = mimeType.split('/')[1];
    return extension === 'jpeg' ? 'jpg' : extension;
  }
  
  // 如果没有MIME类型前缀，默认返回jpg
  return 'jpg';
}