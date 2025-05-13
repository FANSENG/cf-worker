// 导入必要的依赖
import axios from 'axios';

/**
 * Chevereto API配置接口
 */
interface CheveretoConfig {
  apiKey: string;
  apiEndpoint: string;
}

/**
 * Chevereto API响应接口
 */
interface CheveretoResponse {
  status_code: number;
  status_txt: string;
  error?: {
    message: string;
    code: number;
  };
  image?: {
    url: string;
    [key: string]: any; // 其他可能返回的图片信息
  };
}

/**
 * 从环境变量中获取Chevereto配置
 * @param env 环境变量
 * @returns Chevereto配置对象
 */
function getCheveretoConfig(env: Env): CheveretoConfig {
  if (!env.PICGO_KEY || !env.PICGO_API_ENDPOINT) {
    throw new Error('PICGO_KEY, PICGO_API_ENDPOINT 未设置');
  }

  return {
    apiKey: env.PICGO_KEY,
    apiEndpoint: env.PICGO_API_ENDPOINT || 'https://www.picgo.net/api/1/upload',
  };
}

/**
 * 处理Chevereto API错误
 * @param response API响应
 * @throws 如果响应包含错误信息，则抛出错误
 */
function handleCheveretoError(response: CheveretoResponse): void {
  if (response.status_code >= 400 || response.error) {
    const errorMessage = response.error?.message || '未知错误';
    const errorCode = response.error?.code || response.status_code;
    throw new Error(`Chevereto API错误 (${errorCode}): ${errorMessage}`);
  }
}

/**
 * 准备用于上传的FormData
 * @param imageBase64 Base64编码的图像数据
 * @returns 包含图像数据的FormData对象
 */
function prepareFormData(imageBase64: string): FormData {
  // 如果Base64字符串包含前缀，则移除前缀
  const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  // 创建FormData并添加文件
  const formData = new FormData();
  formData.append('source', base64Data);
  
  return formData;
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

/**
 * 发送上传请求到Chevereto API
 * @param config Chevereto配置
 * @param formData 包含图像数据的FormData
 * @returns API响应
 */
async function sendUploadRequest(config: CheveretoConfig, formData: FormData): Promise<CheveretoResponse> {
  const params = new URLSearchParams();
  params.append('source', formData.get('source') as string);
  const response = await axios.post(config.apiEndpoint, params, {
    headers: {
      'X-API-Key': config.apiKey,
    },
  });

  console.log('Chevereto API响应:', response.data);
  return response.data as CheveretoResponse;
}

/**
 * 上传图片到Chevereto服务
 * @param env 环境变量，包含Chevereto API密钥
 * @param imageBase64 Base64编码的图像数据
 * @returns 上传成功后的图像URL
 * @throws 如果配置缺失或上传失败，则抛出错误
 */
export async function uploadImageToChevereto(env: Env, imageBase64: string): Promise<string> {
  // 检查imageBase64是否为有效的Base64格式
  if (!imageBase64) {
    throw new Error('无效的图像数据：图像数据必须是非空字符串');
  }

  try {
    // 获取Chevereto配置
    const config = getCheveretoConfig(env);
    
    // 准备FormData
    const formData = prepareFormData(imageBase64);
    
    // 发送上传请求
    const response = await sendUploadRequest(config, formData);
    
    // 处理可能的错误
    handleCheveretoError(response);
    
    // 返回图像URL
    if (!response.image?.url) {
      throw new Error('上传成功但未返回图像URL');
    }
    
    console.log(`成功上传图像到Chevereto: ${response.image.url}`);
    return response.image.url;
  } catch (error) {
    console.error('上传图像到Chevereto时出错:', error);
    throw error instanceof Error ? error : new Error('上传图像到Chevereto时发生未知错误');
  }
}