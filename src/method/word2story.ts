import { WordToStory } from '../bridge/word2story';

type Word2StoryRequest = {
	words: string[];
};

type Word2StoryResponse = {
	title: string;
	story: string;
	titleZH: string;
	storyZH: string;
};

async function word2story(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	// 1. check params
	const requestBody: Word2StoryRequest = await request.json();
	if (!requestBody.words || !Array.isArray(requestBody.words)) {
		return new Response('Invalid request: "words" field is missing or not an array', { status: 400 });
	}

	// 2. call word2story
	const response = await WordToStory(requestBody.words, env, ctx);

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
		status: 200,
	});
}

export { word2story };
