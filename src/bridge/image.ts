// 导入 SDK, 当 TOS Node.JS SDK 版本小于 2.5.2 请把下方 TosClient 改成 TOS 导入
import { TosClient, TosClientError, TosServerError } from '@volcengine/tos-sdk';

// 从环境变量中获取配置，请确保在您的环境中设置了这些变量
const TOS_ACCESS_KEY = process.env.TOS_ACCESS_KEY || '';
const TOS_SECRET_KEY = process.env.TOS_SECRET_KEY || '';
const TOS_REGION = 'cn-beijing'; // 例如 'cn-beijing'
const TOS_ENDPOINT = 'tos-cn-beijing.volces.com'
const TOS_BUCKET_NAME = 'menus'

// 创建客户端
const client = new TosClient({
  accessKeyId: TOS_ACCESS_KEY,
  accessKeySecret: TOS_SECRET_KEY,
  region: TOS_REGION,
  endpoint: TOS_ENDPOINT,
});

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
export async function getPreSignedDownloadUrl(imagePath: string): Promise<string> {
  if (!TOS_ACCESS_KEY || !TOS_SECRET_KEY || !TOS_REGION || !TOS_ENDPOINT || !TOS_BUCKET_NAME) {
    console.error('Missing TOS configuration in environment variables.');
    throw new Error('TOS configuration is incomplete. Please check environment variables: TOS_ACCESS_KEY, TOS_SECRET_KEY, TOS_REGION, TOS_ENDPOINT, TOS_BUCKET_NAME.');
  }

  try {
    const url = client.getPreSignedUrl({
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

// // 测试方法
// async function testGetUrl() {
//   try {
//     const imageUrl = await getPreSignedDownloadUrl('Snipaste_2025-05-09_15-45-43.png');
//     console.log('Download URL:', imageUrl);
//   } catch (e) {
//     console.error('Failed to get pre-signed URL:', e);
//   }
// }

// // 执行测试
// testGetUrl();