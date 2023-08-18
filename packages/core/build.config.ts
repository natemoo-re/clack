import { defineBuildConfig } from 'unbuild';

// @see https://github.com/unjs/unbuild
export default defineBuildConfig({
	preset: '../../build.preset',
	entries: [
		{
			name: 'index',
			input: 'src/prompts/index',
		},
		{
			name: 'themes',
			input: 'src/themes/index',
		},
	],
});
