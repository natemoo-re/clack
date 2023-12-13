import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as packageExports from '../src/index';

describe('Package', () => {
	const exportedKeys = Object.keys(packageExports);

	it('should export all prompts', async () => {
		const promptsPath = join(__dirname, '../src/prompts');
		const promptFiles = readdirSync(promptsPath);

		for (const file of promptFiles) {
			const prompt = await import(join(promptsPath, file));
			expect(exportedKeys).toContain(prompt.default.name);
		}
	});

	it('should export selected utils', async () => {
		const utils: string[] = ['block', 'isCancel', 'mockPrompt', 'setGlobalAliases'];

		for (const util of utils) {
			expect(exportedKeys).toContain(util);
		}
	});
});
