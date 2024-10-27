/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// 定义路由表
const routes = new Map<string, (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>>();

// 添加路由
routes.set('/hello', handleHello);
routes.set('/about', handleAbout);

// 处理函数
async function handleHello(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	return new Response('Hello, World!');
}

async function handleAbout(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	return new Response('This is the about page.');
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// 获取请求路径
		const url = new URL(request.url);
		const path = url.pathname;

		// 查找匹配的路由
		const handler = routes.get(path);

		if (handler) {
			// 调用处理函数
			return handler(request, env, ctx);
		} else {
			// 返回 404 Not Found
			return new Response('Not Found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
