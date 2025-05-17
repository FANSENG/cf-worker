import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

/**
 * S3 客户端的单例实例。
 * @type {S3Client | null}
 * @private
 *
 * 这个变量在模块级别声明，用于存储 S3Client 的唯一实例。
 * 初始化为 null，当 getS3Client 函数首次被调用时，它将被实例化并赋值。
 * 后续对 getS3Client 的调用将直接返回此已缓存的实例，避免重复创建。
 */
let s3ClientInstance: S3Client | null = null;

/**
 * 获取 S3 客户端的单例。
 *
 * 该函数负责提供一个 S3Client 实例。
 * 如果实例尚未创建（首次调用），它将使用提供的环境变量初始化一个新的 S3Client。
 * 之后的所有调用都将返回这个已创建的实例，以提高性能并减少资源消耗。
 *
 * @param {Env} env - 包含S3客户端配置所需的环境变量对象。
 * - `env.R2_ACCOUNT_ID`: Cloudflare R2 账户ID。
 * - `env.R2_ACCESS_KEY_ID`: R2 访问密钥 ID。
 * - `env.R2_SECRET_ACCESS_KEY`: R2 秘密访问密钥。
 * @returns {S3Client} S3客户端实例。
 * @throws {Error} 如果环境变量中缺少必要的配置（如账户ID、访问密钥ID或秘密访问密钥），则抛出错误。
 */
function getS3Client(env: Env): S3Client {
  // 检查S3客户端实例是否已经被初始化
  if (s3ClientInstance === null) {
    // 日志记录：仅在开发或调试时有意义，生产环境可移除
    // console.log("Initializing S3Client for the first time...");

    // 参数校验：确保必要的环境变量存在
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
      throw new Error(
        "S3Client configuration error: Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY in environment variables."
      );
    }

    // 创建 S3Client 实例
    // S3Client 用于与 S3 兼容的服务（如 Cloudflare R2）进行交互。
    s3ClientInstance = new S3Client({
      /**
       * 区域 (region):
       * 对于 Cloudflare R2，通常设置为 "auto"。
       * R2 会根据存储桶的位置自动处理区域。
       */
      region: "auto",

      /**
       * 端点 (endpoint):
       * R2 的 S3 兼容 API 端点。
       * 格式为 `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`。
       */
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

      /**
       * 凭证 (credentials):
       * 用于向 R2 服务进行身份验证。
       * 这些凭证应该作为机密信息存储和管理。
       */
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,       // R2 访问密钥 ID
        secretAccessKey: env.R2_SECRET_ACCESS_KEY, // R2 秘密访问密钥
      },

      /**
       * 请求处理器 (requestHandler):
       * (可选) 对于某些非 Node.js 环境（例如 Cloudflare Workers 的旧运行时或特定配置），
       * 可能需要明确指定一个 fetch 兼容的 HTTP 请求处理器。
       * 例如：`requestHandler: new FetchHttpHandler({ keepAlive: false })`
       * 在许多现代 Cloudflare Workers 环境中，SDK 可能会自动处理此问题。
       * 如果遇到请求问题，可以尝试取消注释并引入 FetchHttpHandler。
       */
      // requestHandler: new FetchHttpHandler({ keepAlive: false }) // 示例
    });

    // 日志记录：仅在开发或调试时有意义
    // console.log("S3Client initialized successfully.");
  } else {
    // 日志记录：仅在开发或调试时有意义
    // console.log("Returning existing S3Client instance.");
  }

  // 返回已初始化或已缓存的 S3Client 实例
  return s3ClientInstance;
}

/**
 * 从Base64字符串中提取文件扩展名
 * @param base64Data Base64编码的图片数据
 * @returns 文件扩展名
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

/**
 * 获取图片的预签名下载链接。
 * @param env 环境变量
 * @param imagePath 图片在存储桶中的路径/名称 (key)
 * @returns 返回预签名的下载URL字符串
 * @throws 如果配置缺失或生成URL失败，则抛出错误
 */
export async function getPreSignedDownloadUrl(env: Env, imagePath: string): Promise<string> {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ACCOUNT_ID || !env.R2_BUCKET_NAME) {
    throw new Error('R2 S3兼容API的配置缺失 (例如: 密钥, 账户ID, 存储桶名称)');
  }

  if (!imagePath) {
    throw new Error('图片路径不能为空');
  }

  const s3 = getS3Client(env);

  try {
    // 1. 检查对象是否存在 (可选，因为 getSignedUrl 本身不验证，但访问时会失败)
    //    使用 R2 绑定检查会更快，因为它在边缘执行
    if (env.R2_Menus) { // 如果R2绑定也配置了
        const objectMeta = await env.R2_Menus.head(imagePath);
        if (!objectMeta) {
          throw new Error(`图片不存在于R2绑定中: ${imagePath}`);
        }
    } else {
        // 或者通过 S3 API 检查 (会产生额外API调用)
        const headCommand = new HeadObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: imagePath,
        });
        await s3.send(headCommand); // 如果不存在会抛出 NotFound 错误
    }


    // 2. 生成预签名 URL
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: imagePath,
    });

    // 设置预签名URL的有效期为1小时 (3600秒)
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return presignedUrl;

  } catch (error: any) {
    console.error('获取预签名下载链接失败:', error);
    if (error.name === 'NotFound' || (error instanceof Error && error.message.includes("The specified key does not exist"))) {
        throw new Error(`图片不存在: ${imagePath}`);
    }
    throw error instanceof Error ? error : new Error(`获取预签名下载链接时发生未知错误: ${String(error)}`);
  }
}


/**
 * 将Base64编码的图片数据上传到对象存储
 * @param env 环境变量
 * @param imageData 图片数据, Base64编码
 * @returns 上传后的Key，通过 UUID 生成
 * @throws 如果配置缺失或上传失败，则抛出错误
 */
export async function uploadImageToStorage(env: Env, imageData: string): Promise<string> {
  if (!env.R2_Menus) {
    throw new Error('R2存储桶配置缺失');
  }

  if (!imageData) {
    throw new Error('图片数据不能为空');
  }

  try {
    // 提取文件扩展名
    const fileExtension = getFileExtensionFromBase64(imageData);
    
    // 生成唯一的文件名
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // 处理Base64数据
    let binaryData: ArrayBuffer;
    if (imageData.startsWith('data:')) {
      // 如果是带MIME类型的Base64，需要去除前缀
      const base64Content = imageData.split(',')[1];
      binaryData = Buffer.from(base64Content, 'base64');
    } else {
      // 纯Base64数据
      binaryData = Buffer.from(imageData, 'base64');
    }
    
    // 上传到R2存储桶
    await env.R2_Menus.put(fileName, binaryData, {
      httpMetadata: {
        contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
      },
    });
    
    console.log(`成功上传图片到R2存储: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error('上传图片到R2存储失败:', error);
    throw error instanceof Error ? error : new Error('上传图片到R2存储时发生未知错误');
  }
}