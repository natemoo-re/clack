/**
 * This example addresses a issue reported in GitHub Actions where `spinner` was excessively writing messages,
 * leading to confusion and cluttered output.
 * To enhance the CI workflow and provide a smoother experience,
 * the following changes have been made only for CI environment:
 * - Messages will now only be written when a `spinner` method is called and the message updated, preventing unnecessary message repetition.
 * - There will be no loading dots animation, instead it will be always `...`
 * - Instead of erase the previous message, action that is blocked during CI, it will just write a new one.
 *
 * Issue: https://github.com/natemoo-re/clack/issues/168
 */
import * as p from '@clack/prompts';

const s = p.spinner();
let progress = 0;
let counter = 0;
let loop: NodeJS.Timer;

p.intro('Running spinner in CI environment');
s.start('spinner.start');
new Promise((resolve) => {
	loop = setInterval(() => {
		if (progress % 1000 === 0) {
			counter++;
		}
		progress += 100;
		s.message(`spinner.message [${counter}]`);
		if (counter > 6) {
			clearInterval(loop);
			resolve(true);
		}
	}, 100);
}).then(() => {
	s.stop('spinner.stop');
	p.outro('Done');
});
