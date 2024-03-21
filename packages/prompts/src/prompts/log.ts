import color from 'picocolors';
import {
	S_BAR,
	S_BAR_END,
	S_BAR_START,
	S_ERROR,
	S_INFO,
	S_STEP_SUBMIT,
	S_SUCCESS,
	S_WARN
} from '../utils';

export const cancel = (message = '') => {
	process.stdout.write(`${color.gray(S_BAR_END)}  ${color.red(message)}\n\n`);
};

export const intro = (title = '') => {
	process.stdout.write(`${color.gray(S_BAR_START)}  ${title}\n`);
};

export const outro = (message = '') => {
	process.stdout.write(`${color.gray(S_BAR)}\n${color.gray(S_BAR_END)}  ${message}\n\n`);
};

export type LogMessageOptions = {
	symbol?: string;
};

const log = {
	message: (message = '', { symbol = color.gray(S_BAR) }: LogMessageOptions = {}) => {
		const parts = [`${color.gray(S_BAR)}`];
		if (message) {
			const [firstLine, ...lines] = message.split('\n');
			parts.push(`${symbol}  ${firstLine}`, ...lines.map((ln) => `${color.gray(S_BAR)}  ${ln}`));
		}
		process.stdout.write(`${parts.join('\n')}\n`);
	},
	info: (message: string) => {
		log.message(message, { symbol: color.blue(S_INFO) });
	},
	success: (message: string) => {
		log.message(message, { symbol: color.green(S_SUCCESS) });
	},
	step: (message: string) => {
		log.message(message, { symbol: color.green(S_STEP_SUBMIT) });
	},
	warn: (message: string) => {
		log.message(message, { symbol: color.yellow(S_WARN) });
	},
	/** alias for `log.warn()`. */
	warning: (message: string) => {
		log.warn(message);
	},
	error: (message: string) => {
		log.message(message, { symbol: color.red(S_ERROR) });
	},
};

//@ts-expect-error - Name prompt to validate package exports
log.name = 'log';

export default log;
