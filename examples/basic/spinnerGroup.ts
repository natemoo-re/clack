import * as p from '@clack/prompts';

p.intro('spinner groups start...');

const s = p.spinner();
s.start('example start');
await new Promise((resolve) => setTimeout(resolve, 500));
s.stop('example stopped');

await p.spinnerGroup('Outer group', [
	[
		'First sub-task',
		async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		},
	],
	[
		'Second sub-task',
		async () => {
			if (process.env.THROW_ERROR) {
				throw new Error(process.env.THROW_ERROR);
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		},
	],
	[
		'Third sub-task',
		async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		},
	],
]);

p.outro('spinner group stop...');
