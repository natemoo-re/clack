import * as p from '@clack/prompts';
import { setTimeout } from 'node:timers/promises';
import color from 'picocolors';

function onCancel() {
	p.cancel('Operation cancelled.');
	process.exit(0);
}

async function main() {
	console.clear();

	await setTimeout(1000);

	p.intro(`${color.bgCyan(color.black(' changesets '))}`);

	const changeset = await p.group(
		{
			packages: () =>
				p.groupMultiselect({
					message: 'Which packages would you like to include?',
					options: {
						'changed packages': [
							{ value: '@scope/a' },
							{ value: '@scope/b' },
							{ value: '@scope/c' },
						],
						'unchanged packages': [
							{ value: '@scope/x' },
							{ value: '@scope/y' },
							{ value: '@scope/z' },
						],
					},
				}),
			major: ({ results }) => {
				const packages = results.packages ?? [];
				return p.multiselect({
					message: `Which packages should have a ${color.red('major')} bump?`,
					options: packages.map((value) => ({ value })),
					required: false,
				});
			},
			minor: ({ results }) => {
				const packages = results.packages ?? [];
				const major = Array.isArray(results.major) ? results.major : [];
				const possiblePackages = packages.filter((pkg) => !major.includes(pkg));
				if (possiblePackages.length === 0) return;
				return p.multiselect({
					message: `Which packages should have a ${color.yellow('minor')} bump?`,
					options: possiblePackages.map((value) => ({ value })),
					required: false,
				});
			},
			patch: async ({ results }) => {
				const packages = results.packages ?? [];
				const major = Array.isArray(results.major) ? results.major : [];
				const minor = Array.isArray(results.minor) ? results.minor : [];
				const possiblePackages = packages.filter(
					(pkg) => !major.includes(pkg) && !minor.includes(pkg)
				);
				if (possiblePackages.length === 0) return;
				let note = possiblePackages.join(color.dim(', '));

				p.log.step(`These packages will have a ${color.green('patch')} bump.\n${color.dim(note)}`);
				return possiblePackages;
			},
		},
		{
			onCancel,
		}
	);

	const message = await p.text({
		placeholder: 'Summary',
		message: 'Please enter a summary for this change',
	});

	if (p.isCancel(message)) {
		return onCancel();
	}

	p.outro(`Changeset added! ${color.underline(color.cyan('.changeset/orange-crabs-sing.md'))}`);
}

main().catch(console.error);
