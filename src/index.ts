import routes from './router';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		const routeKey = `${method}:${path}`;

		const handler = routes.get(routeKey);

		if (handler) {
			return handler(request, env, ctx);
		} else {
			return new Response(`Not Found${routeKey}`, { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
