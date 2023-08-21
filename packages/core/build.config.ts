import { defineBuildConfig } from 'unbuild';

// @see https://github.com/unjs/unbuild
export default defineBuildConfig({
	preset: '../../build.preset',
	entries: ['src/index'],
});
