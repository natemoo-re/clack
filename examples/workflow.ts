import * as p from '@clack/prompts';

(async () => {
	const results = await p
		.workflow()
		.step('name', () => p.text({ message: 'What is your package name?' }))
		.step('type', () =>
			p.select({
				message: `Pick a project type:`,
				initialValue: 'ts',
				maxItems: 5,
				options: [
					{ value: 'ts', label: 'TypeScript' },
					{ value: 'js', label: 'JavaScript' },
					{ value: 'rust', label: 'Rust' },
					{ value: 'go', label: 'Go' },
					{ value: 'python', label: 'Python' },
					{ value: 'coffee', label: 'CoffeeScript', hint: 'oh no' },
				],
			})
		)
		.step('install', () =>
			p.confirm({
				message: 'Install dependencies?',
				initialValue: false,
			})
		)
		.step('fork', ({ results }) => {
			if (results.install === true) {
				return p
					.workflow()
					.step('package', () =>
						p.select({
							message: 'Pick a package manager:',
							initialValue: 'pnpm',
							options: [
								{
									label: 'npm',
									value: 'npm',
								},
								{
									label: 'yarn',
									value: 'yarn',
								},
								{
									label: 'pnpm',
									value: 'pnpm',
								},
							],
						})
					)
					.run();
			}
		})
		.run();

	await p
		.workflow()
		.step('cancel', () => p.text({ message: 'Try cancel prompt (Ctrl + C):' }))
		.step('afterCancel', () => p.text({ message: 'This will not appear!' }))
		.onCancel(({ results }) => {
			p.cancel('Workflow canceled');
			process.exit(0);
		})
		.run();
})();
