import { Context } from 'hono';
import { alterCategories } from '../bridge/menus';

export async function SaveCategoriesAPI(c: Context): Promise<Response> {
    try {
        // 1. 获取请求参数并校验参数
        const { id, categories } = await c.req.json();
        if (!id || !categories) {
          return c.json({ success: false, message: `缺少必要参数：id:${id}, categories:${categories}` }, 400);
        }
        
        // 2. 保存数据
        if (!categories.includes("其他")) {
            categories.push("其他");
        }
        await alterCategories(c.env, id, categories);

        
        // 3. 返回成功响应
        return c.json({
          success: true,
          message: '类别保存成功',
          data: {
            categories
          }
        });
      } catch (error) {
        return c.json({
          success: false,
          message: '类别保存失败: ' + (error instanceof Error ? error.message : String(error))
        }, 500);
      }
}