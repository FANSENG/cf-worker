// 导入 SDK, 当 TOS Node.JS SDK 版本小于 2.5.2 请把下方 TosClient 改成 TOS 导入
import { TosClient, TosClientError, TosServerError } from '@volcengine/tos-sdk';
// 导入Buffer类型，确保在Cloudflare Workers环境中可用
// import { Buffer } from 'node:buffer';

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
/**
 * 将Base64编码的图片数据上传到对象存储
 * @param env 环境变量，包含TOS访问密钥
 * @param imageData 图片数据, Base64编码
 * @param fileName 可选的文件名，如果不提供则使用时间戳
 * @returns 上传后的图片路径/Key
 * @throws 如果配置缺失或上传失败，则抛出错误
 */
export async function uploadImageToStorage(env: Env, imageData: string, fileName?: string): Promise<string> {
  if (!TOS_REGION || !TOS_ENDPOINT || !TOS_BUCKET_NAME) {
    console.error('Missing TOS configuration in environment variables.');
    throw new Error('TOS configuration is incomplete. Please check environment variables: TOS_ACCESS_KEY, TOS_SECRET_KEY, TOS_REGION, TOS_ENDPOINT, TOS_BUCKET_NAME.');
  }

  // 检测图片格式并提取相关信息
  let contentType = 'image/png';
  let fileExtension = 'png';
  
  // 从Base64字符串中提取MIME类型（如果有）
  const mimeMatch = imageData.match(/^data:([\w\/+]+);base64,/);
  if (mimeMatch && mimeMatch[1]) {
    contentType = mimeMatch[1];
    // 从MIME类型中提取文件扩展名
    const mimeExtMatch = contentType.match(/image\/(\w+)/);
    if (mimeExtMatch && mimeExtMatch[1]) {
      fileExtension = mimeExtMatch[1];
      // 特殊情况处理
      if (fileExtension === 'jpeg') fileExtension = 'jpg';
    }
  }

  // 移除Base64前缀（如果有）
  const base64Data = imageData.replace(/^data:([\w\/+]+);base64,/, '');
  
  // 将Base64转换为二进制数据
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: contentType });
  
  // 生成文件名，如果没有提供则使用时间戳
  const timestamp = new Date().getTime().toString();
  const imagePath = fileName || `image_${timestamp}.${fileExtension}`;
  
  try {
    // 使用REST API直接调用TOS的PutObject接口
    const host = `${TOS_BUCKET_NAME}.${TOS_ENDPOINT}`;
    const url = `https://${host}/${imagePath}`;
    
    // 准备请求头
    const date = new Date().toUTCString();
    
    // 创建规范请求用于签名
    // 火山引擎TOS使用AWS V4签名算法
    const method = 'PUT';
    const amzDate = new Date().toISOString().replace(/[:\-]|\..+/g, '').replace('T', '');
    const dateStamp = amzDate.substring(0, 8);
    
    // 创建规范请求
    const canonicalUri = `/${imagePath}`;
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-tos-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-tos-date';
    
    // 创建请求哈希（空字符串哈希）
    const payloadHash = 'UNSIGNED-PAYLOAD';
    
    // 组合规范请求
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    
    // 创建签名字符串
    const algorithm = 'TOS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${TOS_REGION}/tos/request`;
    
    // 使用WebCrypto API计算规范请求的哈希
    const encoder = new TextEncoder();
    const canonicalRequestData = encoder.encode(canonicalRequest);
    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', canonicalRequestData);
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 创建待签名字符串
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;
    
    // 计算签名密钥
    const kDate = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        encoder.encode(env.TOS_SECRET_KEY),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      encoder.encode(dateStamp)
    );
    
    const kRegion = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new Uint8Array(kDate),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      encoder.encode(TOS_REGION)
    );
    
    const kService = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new Uint8Array(kRegion),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      encoder.encode('tos')
    );
    
    const kSigning = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new Uint8Array(kService),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      encoder.encode('request')
    );
    
    // 计算最终签名
    const signature = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new Uint8Array(kSigning),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      encoder.encode(stringToSign)
    );
    
    // 将签名转换为十六进制字符串
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 构建授权头
    const authorizationHeader = `${algorithm} Credential=${env.TOS_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
    
    // 发送请求
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Host': host,
        'x-tos-date': amzDate,
        'Authorization': authorizationHeader
      },
      body: blob
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TOS API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log(`Successfully uploaded image to TOS: ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error('Error uploading image to TOS:', error);
    // 提供更详细的错误信息
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if ('stack' in error) console.error('Stack:', error.stack);
    }
    throw new Error(`Failed to upload image to TOS: ${error instanceof Error ? error.message : String(error)}`);
  }
}