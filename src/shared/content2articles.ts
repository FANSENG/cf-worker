export interface ContentAnalysisRequest {
	content: string;
}

export interface ContentAnalysisResponse {
	articles: string[];
}

export interface Keywords {
	words: string[];
}
