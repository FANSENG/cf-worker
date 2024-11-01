import { Context } from 'hono';
import { Word2StoryRequest } from '../shared/word2story';
import { InvalidRequestStatus, FailedGenerateStoryStatus } from '../constant/status';
import { Word2Story } from '../method/word2story';

function validateRequest(c: Context): boolean {
	if (!c.req.query('words') || c.req.query('words')?.length === 0) return false;
	return true;
}

function buildRequest(c: Context): Word2StoryRequest {
	try {
		const words = c.req.query('words');
		const parsedWords = JSON.parse(words as string);
		if (!Array.isArray(parsedWords)) throw new Error('Invalid words array');
		return { words: parsedWords };
	} catch (error) {
		return { words: [] };
	}
}

async function Word2StoryAPI(c: Context): Promise<Response> {
	if (!validateRequest(c)) return c.json(InvalidRequestStatus);
	try {
		const resp = await Word2Story(buildRequest(c), c.env as Env, c.executionCtx);
		return c.json(resp);
	} catch (error) {
		console.error(error);
		return c.json(FailedGenerateStoryStatus);
	}
}

export { Word2StoryAPI };
