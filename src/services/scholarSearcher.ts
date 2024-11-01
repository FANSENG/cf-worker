import * as cheerio from 'cheerio';

export class ScholarSearcher {
	private cleanTitle(title: string): string {
		// 匹配所有的 [XXX] 或 [X] 格式，可以重复出现
		return title.replace(/^\s*(?:\[[A-Z]+\]|\[[A-Z]\])\s*/g, '');
	}
	public async search(keywords: string[]): Promise<string[]> {
		try {
			const query = keywords.join(' ');
			const searchUrl = `https://scholar.google.com.hk/scholar?as_sdt=0%2C5&q=${encodeURIComponent(query)}`;
			const response = await fetch(searchUrl);
			if (!response.ok) {
				throw new Error('搜索请求失败');
			}

			const html = await response.text();
			const $ = cheerio.load(html);

			// 查找所有 gs_rt 类的 h3 元素
			const titles: string[] = [];
			$('.gs_rt').each((_, element) => {
				// 获取整个标题文本，包括粗体部分
				const titleText = $(element).text().trim();
				titles.push(this.cleanTitle(titleText));
			});
			return titles;
		} catch (error) {
			console.error('搜索失败:', error);
			throw new Error('论文搜索失败');
		}
	}
}
