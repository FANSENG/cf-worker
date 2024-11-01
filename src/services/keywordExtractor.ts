export class KeywordExtractor {
	public extract(content: string): string[] {
		const words = content.split(/[^a-zA-Z0-9]+/);

		const uniqueWords = new Set<string>();
		const keywords: string[] = [];

		for (let word of words) {
			word = word.toLowerCase();
			if (word.length > 3 && !uniqueWords.has(word)) {
				uniqueWords.add(word);
				keywords.push(word);
			}
		}

		return keywords;
	}
}
