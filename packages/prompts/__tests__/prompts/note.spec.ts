import { randomUUID } from 'crypto';
import color from 'picocolors';
import { note } from '../../src';
import {
	S_BAR,
	S_BAR_H,
	S_CONNECT_LEFT,
	S_CORNER_BOTTOM_RIGHT,
	S_CORNER_TOP_RIGHT,
	S_STEP_SUBMIT
} from '../../src/utils';

const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

describe('note', () => {
	it('should render note box', () => {
		const length = 2;

		note();

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_STEP_SUBMIT)}  ${color.reset('')} ${color.gray(
					S_BAR_H.repeat(length - 1) + S_CORNER_TOP_RIGHT
				)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(length + 2) + S_CORNER_BOTTOM_RIGHT)}`,
				'',
			].join('\n')
		);
	});

	it('should render note box with message', () => {
		const title = '';
		const message = randomUUID();
		const length = message.length + 2;

		note(message);

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
					S_BAR_H.repeat(length - 1) + S_CORNER_TOP_RIGHT
				)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim(message)}${' '.repeat(
					length - message.length
				)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(length + 2) + S_CORNER_BOTTOM_RIGHT)}`,
				'',
			].join('\n')
		);
	});

	it('should render note box with message and title', () => {
		const title = randomUUID();
		const message = randomUUID();
		const length = message.length + 2;

		note(message, title);

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
					S_BAR_H.repeat(length - title.length - 1) + S_CORNER_TOP_RIGHT
				)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim(message)}${' '.repeat(
					length - message.length
				)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(length + 2) + S_CORNER_BOTTOM_RIGHT)}`,
				'',
			].join('\n')
		);
	});

	it('should render note box with message bigger than title', () => {
		const title = randomUUID().replace('-', '');
		const message = randomUUID();
		const length = message.length + 2;

		note(message, title);

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
					S_BAR_H.repeat(length - title.length - 1) + S_CORNER_TOP_RIGHT
				)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim(message)}${' '.repeat(
					length - message.length
				)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(length + 2) + S_CORNER_BOTTOM_RIGHT)}`,
				'',
			].join('\n')
		);
	});

	it('should render note box with title bigger than message', () => {
		const title = randomUUID();
		const message = randomUUID().replace('-', '');
		const length = title.length + 2;

		note(message, title);

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
					S_BAR_H.repeat(length - title.length - 1) + S_CORNER_TOP_RIGHT
				)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim(message)}${' '.repeat(
					length - message.length
				)}${color.gray(S_BAR)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(length + 2) + S_CORNER_BOTTOM_RIGHT)}`,
				'',
			].join('\n')
		);
	});

	it('should render note box with multiline message', () => {
		const title = randomUUID();
		const message = randomUUID().replace('\n', '');
		const length = title.length + 2;

		note(message, title);

		expect(outputSpy).toHaveBeenCalledWith(
			[
				color.gray(S_BAR),
				`${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
					S_BAR_H.repeat(length - title.length - 1) + S_CORNER_TOP_RIGHT
				)}`,
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				message.split('\n').map((line) => {
					return `${color.gray(S_BAR)}  ${color.dim(line)}${' '.repeat(
						length - message.length
					)}${color.gray(S_BAR)}`;
				}),
				`${color.gray(S_BAR)}  ${color.dim('')}${' '.repeat(length)}${color.gray(S_BAR)}`,
				`${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(length + 2) + S_CORNER_BOTTOM_RIGHT)}`,
				'',
			]
				.flat()
				.join('\n')
		);
	});
});
