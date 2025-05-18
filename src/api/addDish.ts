import { Context } from 'hono';
import { addDish } from '../bridge/menus';
import {uploadImageToStorage} from '../bridge/image'

export async function AddDishAPI(c: Context): Promise<Response> {
    try {
        // 获取请求参数
        const { menusId, name, image, categoryName } = await c.req.json();
     
        // 参数验证
        if (!menusId || !name || !image || !categoryName) {
          return c.json({ success: false, message: `缺少必要参数：menusId:${menusId}、name:${name}、image:${image}、categoryName:${categoryName}` }, 400);
        }
        
        // 上传图片到存储，获取图片路径
        const imagePath = await uploadImageToStorage(c.env, image);
        
        // 构造菜单信息
        const dish = {
          name,
          image: imagePath,
          categoryName:categoryName,
        };
        
        // 调用createMenu函数创建菜单
        const result = await addDish(c.env,menusId, dish);
        
        // 返回成功响应
        return c.json({
          success: true,
          message: '菜品添加成功',
          data: {
            menusId,
            name,
            categoryName
          }
        });
      } catch (error) {
        return c.json({
          success: false,
          message: '菜品添加失败: ' + (error instanceof Error ? error.message : String(error))
        }, 500);
      }
}