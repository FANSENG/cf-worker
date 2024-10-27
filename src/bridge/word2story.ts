import { OpenAI } from 'openai';

type StoryStruct = {
	title: string;
	story: string;
	titleZH: string;
	storyZH: string;
};

async function WordToStory(wordList: string[], env: Env, ctx: ExecutionContext): Promise<StoryStruct> {
	try {
		const completion = await new OpenAI({
			baseURL: `${env.BaseURI}`,
			apiKey: `${env.APIKEY}`,
			dangerouslyAllowBrowser: true,
		}).chat.completions.create({
			model: 'GLM-4-Flash',
			messages: [
				{
					role: 'user',
					content: `
                Given a list of up to 10 words, ${JSON.stringify(
									wordList
								)}, generate a short English story(100words) that incorporates all the words. The output should be in JSON format with two key-value pairs: "title", "story", "titleZH" and "storyZH". The title should be a brief, engaging title for the story, and the story should be a coherent, creative narrative that uses all the provided words.

                Please return the JSON directly without any additional text or Markdown formatting.

                Example output:
                {
                "title": "The Mysterious Treasure in the Forest",
                "story": "Once upon a time, a group of friends decided to go on an adventure in the dense forest. They had heard rumors of a hidden treasure, and they were determined to find it. Armed with a map and a key, they set out at night, following the river that led to a mysterious cave. As they entered the cave, they felt a sense of excitement and fear. The darkness was overwhelming, but their determination kept them going. After hours of searching, they finally found the treasure, and it was more magnificent than they had ever imagined. Their friendship grew stronger through this adventure, and they knew that they would always remember the night they solved the mystery of the forest.",
                "titleZH": "在森林中的神秘宝藏",
                "storyZH": "从前，一群朋友决定去茂密的森林探险。他们听到了关于隐藏宝藏的传言，决心找到它。他们拿着地图和钥匙，在晚上出发，沿着通往一个神秘洞穴的河流前进。当他们进入洞穴时，他们感到兴奋和恐惧。黑暗势不可挡，但他们的决心让他们继续前进。经过数小时的搜寻，他们终于找到了宝藏，它比他们想象的还要壮观。他们的友谊在这次冒险中变得更加牢固，他们知道他们会永远记住他们解开森林之谜的那个晚上。"
                }
              `,
				},
			],
			max_tokens: 3000,
			temperature: 0.5,
		});

		const content = completion.choices[0].message.content as string;
		console.log(content);
		const resp: StoryStruct = JSON.parse(content);

		return resp;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to generate story.');
	}
}

export { WordToStory };
