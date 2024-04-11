import * as p from '@clack/prompts';

(async () => {
	const selectResult = await p.selectPath({
		message: 'Pick a file with select component:',
		initialValue: process.cwd(),
		onlyShowDir: false,
	});
	if (p.isCancel(selectResult)) {
		p.cancel('File selection canceled');
		process.exit(0);
	}

	console.log({ selectResult });
})();
