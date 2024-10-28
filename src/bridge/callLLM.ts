import { OpenAI } from 'openai';
import { Word2StoryRequest, Word2StoryResponse } from '../shared/word2story';

async function CreateChat(
	prompt: string,
	baseURL: string,
	apiKey: string,
	model: string = 'GLM-4-Flash',
	maxTokens: number = 3000,
	temperature: number = 0.5
): Promise<string> {
	try {
		const completion = await new OpenAI({
			baseURL: `${baseURL}`,
			apiKey: `${apiKey}`,
		}).chat.completions.create({
			model: model,
			messages: [
				{
					role: 'user',
					content: prompt,
				},
			],
			max_tokens: maxTokens,
			temperature: temperature,
		});
		return completion.choices[0].message.content as string;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to generate story.');
	}
}

export { CreateChat };
