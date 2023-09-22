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
