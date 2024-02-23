/** @type {import('jest').Config} */
export default {
	bail: true,
	clearMocks: true,
	testEnvironment: 'node',
	transform: {
		'^.+\\.ts$': '@swc/jest',
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	testRegex: ['__tests__/.+(spec|test).ts$'],
	setupFiles: ['<rootDir>/setup.tests.ts'],
};
