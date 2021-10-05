module.exports = {
	preset: 'ts-jest',
	collectCoverageFrom: [
		'**/*.(t|j)s',
	],
	coverageDirectory: './coverage',
	moduleFileExtensions: [
		'js',
		'json',
		'ts',
	],
	rootDir: './',
	testEnvironment: 'node',
	testMatch: [ '<rootDir>/**/*.spec.ts' ],
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	globals: {
		'ts-jest': {
			isolatedModules: true,
			tsconfig: 'tsconfig.spec.json',
		},
	},
	setupFilesAfterEnv: [
		'jest-extended',
		'./test/setup-jest.ts',
	],
};
