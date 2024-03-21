import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as packageExports from '../src/index';

function camelCase(input: string): string {
	return input.replace(/[-_]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
}

describe('Package', () => {
	const exportedKeys = Object.keys(packageExports);

	it('should export all prompts', async () => {
		const promptsPath = join(__dirname, '../src/prompts');
		const promptFiles = readdirSync(promptsPath);

		for (const file of promptFiles) {
			const prompt = await import(join(promptsPath, file));
			expect(exportedKeys).toContain(camelCase(prompt.default.name));
		}
	});

	it('should export selected utils', async () => {
		const utils: (keyof typeof packageExports)[] = ['isCancel', 'mockPrompt', 'setGlobalAliases'];
		for (const util of utils) {
			expect(exportedKeys).toContain(util);
		}
	});

	it('should export selected loggers', async () => {
		const loggers: (keyof typeof packageExports)[] = ['cancel', 'intro', 'outro'];
		for (const logger of loggers) {
			expect(exportedKeys).toContain(logger);
		}
	});
});
