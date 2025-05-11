import { D1Database } from '@cloudflare/workers-types';

export async function executeSQL(env: Env, sql: string): Promise<any> {
  try {
    const db: D1Database = env.D1_Menus;
    const result = await db.prepare(sql).all();
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}