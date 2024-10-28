export interface Word2StoryRequest {
	words: string[];
}

export interface Word2StoryResponse {
	title: string;
	story: string;
	titleZH: string;
	storyZH: string;
}
