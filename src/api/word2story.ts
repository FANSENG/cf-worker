import { Context } from 'hono';
import { Word2StoryRequest, Word2StoryResponse } from '../shared/word2story';
import { InvalidRequestStatus } from '../constant/statu';
import { Word2Story } from '../method/word2story';

function validateRequest(c: Context): boolean {
	if (!c.req.query('words') || c.req.query('words')?.length === 0) return false;
	return true;
}

function buildRequest(c: Context): Word2StoryRequest {
	return JSON.parse(c.req.query('words') as string);
}

async function Word2StoryAPI(c: Context): Promise<Response> {
	if (validateRequest(c)) return c.json(InvalidRequestStatus);
	const resp = await Word2Story(buildRequest(c), c.env as Env, c.executionCtx);
	return c.json(resp);
}

export { Word2StoryAPI };
