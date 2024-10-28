interface Status {
	code: number;
	message: string;
}

const InvalidRequestStatus: Status = {
	message: 'Invalid request',
	code: 400,
};

export { InvalidRequestStatus };
