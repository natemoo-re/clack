import { randomUUID } from 'crypto';
import color from 'picocolors';
import { cancel, intro, log, outro } from '../../src';
import {
	S_BAR,
	S_BAR_END,
	S_BAR_START,
	S_ERROR,
	S_INFO,
	S_STEP_SUBMIT,
	S_SUCCESS,
	S_WARN
} from '../../src/utils';

const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

describe('log', () => {
	it('should log `cancel`', () => {
		const message = 'Canceled';

		cancel();
		cancel(message);

		expect(outputSpy).toHaveBeenCalledWith(`${color.gray(S_BAR_END)}  ${color.red('')}\n\n`);
		expect(outputSpy).toHaveBeenCalledWith(`${color.gray(S_BAR_END)}  ${color.red(message)}\n\n`);
	});

	it('should log `intro`', () => {
		const title = 'Hello World';

		intro();
		intro(title);

		expect(outputSpy).toHaveBeenCalledWith(`${color.gray(S_BAR_START)}  \n`);
		expect(outputSpy).toHaveBeenCalledWith(`${color.gray(S_BAR_START)}  ${title}\n`);
	});

	it('should log `outro`', () => {
		const message = 'Good Bye World';

		outro();
		outro(message);

		expect(outputSpy).toHaveBeenCalledWith(`${color.gray(S_BAR)}\n${color.gray(S_BAR_END)}  \n\n`);
		expect(outputSpy).toHaveBeenCalledWith(
			`${color.gray(S_BAR)}\n${color.gray(S_BAR_END)}  ${message}\n\n`
		);
	});

	it('should log `log.message`', () => {
		const messageParts = randomUUID().split('-');

		log.message();
		log.message(messageParts.join('\n'), { symbol: color.green(S_INFO) });

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_INFO)}  ${messageParts[0]}`,
				messageParts.slice(1).map((part) => `${color.gray(S_BAR)}  ${part}`),
				'',
			]
				.flat()
				.join('\n')
		);
		expect(outputSpy).toHaveBeenCalledWith(`${color.gray(S_BAR)}\n`);
	});

	it('should log `log.info`', () => {
		const messageParts = randomUUID().split('-');

		log.info(messageParts.join('\n'));

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.blue(S_INFO)}  ${messageParts[0]}`,
				messageParts.slice(1).map((part) => `${color.gray(S_BAR)}  ${part}`),
				'',
			]
				.flat()
				.join('\n')
		);
	});

	it('should log `log.success`', () => {
		const messageParts = randomUUID().split('-');

		log.success(messageParts.join('\n'));

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_SUCCESS)}  ${messageParts[0]}`,
				messageParts.slice(1).map((part) => `${color.gray(S_BAR)}  ${part}`),
				'',
			]
				.flat()
				.join('\n')
		);
	});

	it('should log `log.step`', () => {
		const messageParts = randomUUID().split('-');

		log.step(messageParts.join('\n'));

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_STEP_SUBMIT)}  ${messageParts[0]}`,
				messageParts.slice(1).map((part) => `${color.gray(S_BAR)}  ${part}`),
				'',
			]
				.flat()
				.join('\n')
		);
	});

	it('should log `log.warn`', () => {
		const messageParts = randomUUID().split('-');

		log.warn(messageParts.join('\n'));

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.yellow(S_WARN)}  ${messageParts[0]}`,
				messageParts.slice(1).map((part) => `${color.gray(S_BAR)}  ${part}`),
				'',
			]
				.flat()
				.join('\n')
		);
	});

	it('should log `log.warning`', () => {
		const messageParts = randomUUID().split('-');

		log.warn(messageParts.join('\n'));
		log.warning(messageParts.join('\n'));
		const expected = [
			color.gray(S_BAR),
			`${color.yellow(S_WARN)}  ${messageParts[0]}`,
			messageParts.slice(1).map((part) => `${color.gray(S_BAR)}  ${part}`),
			'',
		]
			.flat()
			.join('\n');

		expect(outputSpy).toHaveBeenNthCalledWith(1, expected);
		expect(outputSpy).toHaveBeenNthCalledWith(2, expected);
	});

	it('should log `log.error`', () => {
		const messageParts = randomUUID().split('-');

		log.error(messageParts.join('\n'));

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.red(S_ERROR)}  ${messageParts[0]}`,
				messageParts.slice(1).map((part) => `${color.gray(S_BAR)}  ${part}`),
				'',
			]
				.flat()
				.join('\n')
		);
	});
});
