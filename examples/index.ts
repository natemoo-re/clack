import * as p from '@clack/prompts';
import color from 'picocolors';

(async () => {
	console.clear();

	p.intro(`${color.bgCyan(color.black(' clack-examples '))}`);

	// Choose example to run
	const example = await p.select({
		message: 'Choose an example:',
		options: [
			{ label: 'Basic', value: 'basic', hint: 'basic project setup' },
			{ label: 'Changesets', value: 'changesets', hint: 'mimics the changesets cli' },
			{ label: 'Spinner', value: 'spinner', hint: 'shows off the spinner functionality' },
			{ label: 'Workflow', value: 'workflow' },
		],
	});

	if (p.isCancel(example)) return;

	try {
		// Run example
		process.stdout.write('\n');
		await import(`./${example}.ts`);
	} catch (error) {
		// Don't crash on error
	}
})();
