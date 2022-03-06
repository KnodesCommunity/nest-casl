const baseConfig = {
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

module.exports = {
	projects: [
		{
			...baseConfig,
			displayName: {
				name: 'unit',
				color: 'blue',
			},
		},
		{
			...baseConfig,
			coverageDirectory: undefined,
			collectCoverage: false,
			testMatch: [ '<rootDir>/test/**/*.e2e-spec.ts' ],
			globals: {
				'ts-jest': {
					...baseConfig.globals[ 'ts-jest' ],
					tsconfig: './tsconfig.e2e-spec.json',
				},
			},
			moduleNameMapper: {
				'@knodes/nest-casl': '<rootDir>/src',
			},
			maxWorkers: 1,
			displayName: {
				name: 'e2e',
				color: 'red',
			},
		},
	],
};
