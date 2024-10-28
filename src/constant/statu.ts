interface Status {
	code: number;
	message: string;
}

const InvalidRequestStatus: Status = {
	message: 'Invalid request: "words" field is missing',
	code: 400,
};

export { InvalidRequestStatus };
