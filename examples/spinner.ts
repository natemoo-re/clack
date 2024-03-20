import * as p from '@clack/prompts';

p.intro('spinner start...');

const spin = p.spinner();
const total = 10000;
let progress = 0;
spin.start();

new Promise((resolve) => {
	const timer = setInterval(() => {
		progress = Math.min(total, progress + 100);
		if (progress >= total) {
			clearInterval(timer);
			resolve(true);
		}
		spin.message(`Loading packages [${progress}/${total}]`); // <===
	}, 100);
}).then(() => {
	spin.stop(`Done`);
	p.outro('spinner stop...');
});
