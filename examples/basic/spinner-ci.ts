import * as p from '@clack/prompts';

const s = p.spinner();
let counter = 0;
let loop: NodeJS.Timer;

p.intro('Running spinner in CI environment');
s.start('spinner.start');
new Promise((resolve) => {
	loop = setInterval(() => {
		counter++;
		s.message(`spinner.message [${counter}]`);
		if (counter > 6) {
			clearInterval(loop);
			resolve(true);
		}
	}, 1000);
}).then(() => {
	s.stop('spinner.stop');
	p.outro('Done');
});
