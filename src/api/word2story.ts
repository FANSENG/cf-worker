import { Context } from 'hono';
import { Word2StoryRequest, Word2StoryResponse } from '../shared/word2story';
import { InvalidRequestStatus } from '../constant/statu';
import { WordToStory } from '../bridge/word2story';

async function word2story(c: Context): Promise<Response> {
	if (!c.req.query('words')) return c.json(InvalidRequestStatus);
	const req: Word2StoryRequest = JSON.parse(c.req.query('words') as string);
	const resp = await WordToStory(req, c.env as Env, c.executionCtx);
	return c.json(resp);
}

export { word2story };
