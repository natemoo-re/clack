import color from 'picocolors';
import {
	strip,
	S_BAR,
	S_BAR_H,
	S_CONNECT_LEFT,
	S_CORNER_BOTTOM_RIGHT,
	S_CORNER_TOP_RIGHT,
	S_STEP_SUBMIT
} from '../utils';

const note = (message = '', title = '') => {
	const lines = `\n${message}\n`.split('\n');
	const titleLen = strip(title).length;
	const len =
		Math.max(
			lines.reduce((sum, ln) => {
				ln = strip(ln);
				return ln.length > sum ? ln.length : sum;
			}, 0),
			titleLen
		) + 2;
	const msg = lines
		.map(
			(ln) =>
				`${color.gray(S_BAR)}  ${color.dim(ln)}${' '.repeat(len - strip(ln).length)}${color.gray(
					S_BAR
				)}`
		)
		.join('\n');
	process.stdout.write(
		`${color.gray(S_BAR)}\n${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
			S_BAR_H.repeat(Math.max(len - titleLen - 1, 1)) + S_CORNER_TOP_RIGHT
		)}\n${msg}\n${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(len + 2) + S_CORNER_BOTTOM_RIGHT)}\n`
	);
};

export default note;
