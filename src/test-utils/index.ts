export const createFakeExecutionContext = () => {
	const request = {} as Record<any, any>;
	const context = {
		switchToHttp: jest.fn().mockReturnValue( {
			getRequest: jest.fn().mockReturnValue( request ),
		} ),
		getClass: jest.fn().mockReturnValue( {} ),
		getHandler: jest.fn().mockReturnValue( {} ),
	} as any;
	return { request, context };
};
