import { Context } from 'hono';
import { Word2StoryRequest, Word2StoryResponse } from '../shared/word2story';
import { InvalidRequestStatus } from '../constant/statu';
import { WordToStory } from '../bridge/word2story';

async function word2story(c: Context): Promise<Response> {
	if (!c.req.query('words')) return c.json(InvalidRequestStatus);
	const req: Word2StoryRequest = JSON.parse(c.req.param('words') as string);
	return c.json(WordToStory(req, c.env as Env, c.executionCtx));
}

export { word2story };
