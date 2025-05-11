// 导入 SDK, 当 TOS Node.JS SDK 版本小于 2.5.2 请把下方 TosClient 改成 TOS 导入
import { TosClient, TosClientError, TosServerError } from '@volcengine/tos-sdk';

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
    console.log(`Successfully generated pre-signed URL for ${imagePath}: ${url}`);
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
 * @param fileName 可选的文件名，如果不提供则使用时间戳
 * @returns 上传后的图片路径/Key
 * @throws 如果配置缺失或上传失败，则抛出错误
 */
export async function uploadImageToStorage(env: Env, imageData: string): Promise<string> {
  if (!TOS_REGION || !TOS_ENDPOINT || !TOS_BUCKET_NAME) {
    console.error('Missing TOS configuration in environment variables.');
    throw new Error('TOS configuration is incomplete. Please check environment variables: TOS_ACCESS_KEY, TOS_SECRET_KEY, TOS_REGION, TOS_ENDPOINT, TOS_BUCKET_NAME.');
  }

  // 移除Base64前缀（如果有）
  const base64Data = imageData.replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, '');
  
  // 将Base64转换为Buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // 生成文件名，如果没有提供则使用时间戳
  const timestamp = new Date().getTime().toString();
  const imagePath = `image_${timestamp}.png`;
  
  try {
    // 使用TOS SDK上传文件
    const result = await initializeTosClient(env).putObject({
      bucket: TOS_BUCKET_NAME,
      key: imagePath,
      body: buffer,
      // 可选：设置Content-Type
      contentType: 'image/png',
      // 可选：设置元数据
      meta: {
        'upload-time': timestamp
      }
    });
    
    // console.log(`Successfully uploaded image to TOS: ${imagePath}`, result);
    return imagePath;
  } catch (error) {
    handleError(error); // 错误将在这里被捕获并重新抛出
    return ''; // 由于handleError会抛出错误，这里的return实际上不会执行，但为了类型符合性可以保留
  }
}