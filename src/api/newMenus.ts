import { Context } from 'hono';
import { createMenu } from '../store/menus';
import {uploadImageToStorage} from '../bridge/image'


/**
 * 创建新菜单的API处理函数
 * @param c Hono上下文
 */
export async function NewMenusAPI(c: Context): Promise<Response> {
  try {
    // 获取请求参数
    const { id, name, image } = await c.req.json();
 
    // 参数验证
    if (!id || !name || !image) {
      return c.json({ success: false, message: '缺少必要参数：id、name或image' }, 400);
    }
    
    // 上传图片到存储，获取图片路径
    const imagePath = await uploadImageToStorage(c.env, image);
    
    // 构造菜单信息
    const menusInfo = {
      name,
      image: imagePath
    };
    
    // 调用createMenu函数创建菜单
    const result = await createMenu(c.env, id, menusInfo);
    
    // 返回成功响应
    return c.json({
      success: true,
      message: '菜单创建成功',
      data: {
        id,
        menusInfo
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: '创建菜单失败: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
}