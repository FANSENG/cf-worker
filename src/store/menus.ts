import { executeSQL } from '../bridge/d1';
// 确保 Env 类型已导入或全局可用。
// 对于 Cloudflare Workers, Env 通常在全局的 `worker-configuration.d.ts` 文件中定义，
// 或者从主 worker 文件 (例如 src/index.ts) 导出。
// 示例: import type { Env } from '../../worker-configuration'; // 如果您有 worker-configuration.d.ts
// 或者: import type { Env } from '../index'; // 假设 Env 从 src/index.ts 导出
// 如果 Env 的定义在其他位置，请相应地调整导入路径。

const tableName = 'menus';

interface MenusInTable {
    id: number;
    menusInfo: string; // 存储为 JSON 字符串
    categories: string; // 存储为 JSON 字符串
    dishes: string; // 存储为 JSON 字符串
}

interface Menu {
    id: number;
    menusInfo: MenusInfo;
    categories: Category[];
    dishes: Dish[];
}

interface MenusInfo{
    name: string;
    image: string;
}
  
interface Category {
    name: string;
}

interface Dish {
    name: string;
    image: string;
    categoryName: string;
}

const defaultCategories = ["其他"];

export async function createMenu(env: Env, id: number, menusInfo: MenusInfo): Promise<any> {
    const menusInfoStr = JSON.stringify(menusInfo);
    const categoriesStr = JSON.stringify(defaultCategories); // 新菜单的空 categories
    const dishesStr = JSON.stringify([]);     // 新菜单的空 dishes

    // 重要提示: 请验证下面的表名 (当前为 'Menus') 是否与您的实际数据库表名匹配。
    // 警告: 下面的 SQL 构建方式使用字符串插值来构建 SQL 值，这可能存在安全风险 (SQL 注入)。
    // 强烈建议修改 `d1.ts` 中的 `executeSQL` 函数以支持参数化查询，并安全地传递值。
    // 例如，d1.ts 中的 executeSQL 可以修改为接收一个可选的参数数组:
    // export async function executeSQL(env: Env, sql: string, params?: any[]): Promise<any> {
    //   const stmt = params ? db.prepare(sql).bind(...params) : db.prepare(sql);
    //   const result = await stmt.all();
    //   ...
    // }
    // 然后在这里调用:
    // const sql = 'INSERT INTO Menus (id, menusInfo, categories, dishes) VALUES (?, ?, ?, ?)';
    // return await executeSQL(env, sql, [id, menusInfoStr, categoriesStr, dishesStr]);
    
    // 当前的实现采用简单的单引号替换进行转义，这对于防止所有类型的SQL注入是不够的。
    // 请务必考虑上述关于参数化查询的建议以增强安全性。
    const escapedMenusInfoStr = menusInfoStr.replace(/'/g, "''");
    const escapedCategoriesStr = categoriesStr.replace(/'/g, "''");
    const escapedDishesStr = dishesStr.replace(/'/g, "''");

    const sql = `INSERT INTO '${tableName}' (id, menus_info, categories, dishes) VALUES (${id}, '${escapedMenusInfoStr}', '${escapedCategoriesStr}', '${escapedDishesStr}')`;

    return await executeSQL(env, sql);
}

export async function alterCategories(env: Env, id: number, categories: string[]): Promise<any> {
    const categoriesStr = JSON.stringify(categories);
    const sql = `UPDATE '${tableName}' SET categories = '${categoriesStr}' WHERE id = ${id}`;
    return await executeSQL(env, sql);
}