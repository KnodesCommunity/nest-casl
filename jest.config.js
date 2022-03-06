module.exports = {
	preset: 'ts-jest',
	collectCoverageFrom: [
		'src/**/*.(t|j)s',
		'!**/test-utils/**',
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
		'jest-extended/all',
		'./test/setup-jest.ts',
	],
};
