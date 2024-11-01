import { Context } from 'hono';
import { ContentAnalysisRequest, ContentAnalysisResponse } from '../shared/content2articles';
import { KeywordExtractor } from '../services/keywordExtractor';
import { ScholarSearcher } from '../services/scholarSearcher';
import { InvalidRequestStatus, FailedSearchStatus } from '../constant/status';

const keywordExtractor = new KeywordExtractor();
const scholarSearcher = new ScholarSearcher();

function validateRequest(c: Context): boolean {
	const content = c.req.query('content') as string;
	return content !== null && content.length > 0;
}

function buildRequest(c: Context): ContentAnalysisRequest {
	return {
		content: c.req.query('content') || '',
	};
}

async function Content2ArticlesAPI(c: Context): Promise<Response> {
	if (!validateRequest(c)) {
		return c.json(InvalidRequestStatus);
	}

	try {
		const request = buildRequest(c);
		const keywords = keywordExtractor.extract(request.content);
		const articles = await scholarSearcher.search(keywords);

		const response: ContentAnalysisResponse = {
			articles: articles,
		};

		console.log('request', request);
		console.log('response', response);

		return c.json(response);
	} catch (error) {
		console.log('error');
		console.log(error);
		return c.json(FailedSearchStatus);
	}
}

export { Content2ArticlesAPI };
