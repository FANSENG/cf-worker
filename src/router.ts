import { word2story } from './method/word2story';

const routes = new Map<string, (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>>();

routes.set('GET:/word2story', word2story);

export default routes;
