import * as p from '@clack/prompts';

(async () => {
	const selectResult = await p.path({
		type: 'select',
		message: 'Pick a file with select component:',
		initialValue: process.cwd(),
		onlyShowDir: false,
		maxItems: 15,
	});
	if (p.isCancel(selectResult)) {
		p.cancel('File selection canceled');
		process.exit(0);
	}

	const inputResult = await p.path({
		type: 'text',
		message: 'Pick other file with input component:',
		onlyShowDir: false,
		placeholder: process.cwd(),
	});
	if (p.isCancel(inputResult)) {
		p.cancel('File input canceled');
		process.exit(0);
	}

	console.log({ selectResult, inputResult });
})();
