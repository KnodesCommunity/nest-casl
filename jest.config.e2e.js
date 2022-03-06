const baseConfig = require( './jest.config' );

module.exports = {
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
	// runner: 'jest-serial-runner', // Weird bug probably related to https://github.com/gabrieli/jest-serial-runner/issues/6
};
