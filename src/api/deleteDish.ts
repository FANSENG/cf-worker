import { Context } from 'hono';
import { RemoveDishAndGetURL } from '../bridge/menus';
import {RemoveImage} from '../bridge/image'

export async function DeleteDishAPI(c: Context): Promise<Response> {
    try {
        // 获取请求参数
        const { menusId, name} = await c.req.json();
     
        // 参数验证
        if (!menusId || !name) {
          return c.json({ success: false, message: `缺少必要参数：menusId:${menusId}、name:${name}` }, 400);
        }
        
        // 移除菜品
        const imageURL = await RemoveDishAndGetURL(c.env, menusId, name);
        // 移除图片
        await RemoveImage(c.env, imageURL);
        
        // 返回成功响应
        return c.json({
          success: true,
          message: '菜品删除成功',
          data: {
            menusId,
            name,
          }
        });
      } catch (error) {
        return c.json({
          success: false,
          message: '菜品删除失败: ' + (error instanceof Error ? error.message : String(error))
        }, 500);
      }
}