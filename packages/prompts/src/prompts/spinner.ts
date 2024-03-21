import { block } from '@clack/core';
import color from 'picocolors';
import { cursor, erase } from 'sisteransi';
import { isUnicodeSupported, S_BAR, S_STEP_CANCEL, S_STEP_ERROR, S_STEP_SUBMIT } from '../utils';

export const frames = isUnicodeSupported ? ['◒', '◐', '◓', '◑'] : ['•', 'o', 'O', '0'];
export const frameInterval = isUnicodeSupported ? 80 : 120;
export const dotsInterval = 0.125;

const spinner = () => {
	let unblock: () => void;
	let loop: NodeJS.Timeout;
	let isSpinnerActive: boolean = false;
	let _message: string = '';

	const handleExit = (code: number) => {
		const msg = code > 1 ? 'Something went wrong' : 'Canceled';
		if (isSpinnerActive) stop(msg, code);
	};

	const errorEventHandler = () => handleExit(2);
	const signalEventHandler = () => handleExit(1);

	const registerHooks = () => {
		// Reference: https://nodejs.org/api/process.html#event-uncaughtexception
		process.on('uncaughtExceptionMonitor', errorEventHandler);
		// Reference: https://nodejs.org/api/process.html#event-unhandledrejection
		process.on('unhandledRejection', errorEventHandler);
		// Reference Signal Events: https://nodejs.org/api/process.html#signal-events
		process.on('SIGINT', signalEventHandler);
		process.on('SIGTERM', signalEventHandler);
		process.on('exit', handleExit);
	};

	const clearHooks = () => {
		process.removeListener('uncaughtExceptionMonitor', errorEventHandler);
		process.removeListener('unhandledRejection', errorEventHandler);
		process.removeListener('SIGINT', signalEventHandler);
		process.removeListener('SIGTERM', signalEventHandler);
		process.removeListener('exit', handleExit);
	};

	const start = (msg: string = ''): void => {
		isSpinnerActive = true;
		unblock = block();
		_message = msg.replace(/\.+$/, '');
		process.stdout.write(`${color.gray(S_BAR)}\n`);
		let frameIndex = 0;
		let dotsTimer = 0;
		registerHooks();
		loop = setInterval(() => {
			const frame = color.magenta(frames[frameIndex]);
			const loadingDots = '.'.repeat(Math.floor(dotsTimer)).slice(0, 3);
			process.stdout.write(cursor.move(-999, 0));
			process.stdout.write(erase.down(1));
			process.stdout.write(`${frame}  ${_message}${loadingDots}`);
			frameIndex = frameIndex + 1 < frames.length ? frameIndex + 1 : 0;
			dotsTimer = dotsTimer < frames.length ? dotsTimer + dotsInterval : 0;
		}, frameInterval);
	};

	const stop = (msg: string = '', code: number = 0): void => {
		if (!isSpinnerActive) return;
		isSpinnerActive = false;
		_message = msg ?? _message;
		clearInterval(loop);
		const step =
			code === 0
				? color.green(S_STEP_SUBMIT)
				: code === 1
				? color.red(S_STEP_CANCEL)
				: color.red(S_STEP_ERROR);
		process.stdout.write(cursor.move(-999, 0));
		process.stdout.write(erase.down(1));
		process.stdout.write(`${step}  ${_message}\n`);
		clearHooks();
		unblock();
	};

	const message = (msg: string = ''): void => {
		_message = msg ?? _message;
	};

	return {
		start,
		stop,
		message,
	};
};

export default spinner;
