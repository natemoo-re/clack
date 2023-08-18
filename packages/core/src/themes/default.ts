import Prompt, { State } from '../prompts/prompt';
import { TemplateOptions } from './types';
import * as S from './symbols';
import color from 'picocolors';

const symbol = (state: State) => {
	switch (state) {
		case 'initial':
		case 'active':
			return color.cyan(S.STEP_ACTIVE);
		case 'cancel':
			return color.red(S.STEP_CANCEL);
		case 'error':
			return color.yellow(S.STEP_ERROR);
		case 'submit':
			return color.green(S.STEP_SUBMIT);
	}
};

const format = Prompt.prototype.format;

export function template(data: TemplateOptions): string {
	const { ctx, message } = data;

	const title = [
		color.gray(S.BAR),
		format(message, {
			firstLine: {
				start: symbol(ctx.state),
			},
			default: {
				start: color.gray(S.BAR),
			},
		}),
	].join('\n');

	const placeholder = data.placeholder
		? color.inverse(data.placeholder[0]) + color.dim(data.placeholder.slice(1))
		: color.inverse(color.hidden('_'));

	const value = data.value ?? '';

	switch (ctx.state) {
		case 'cancel':
			return [
				title,
				format(value, {
					default: {
						start: color.gray(S.BAR),
						style: (line) => color.strikethrough(color.dim(line)),
					},
				}),
			].join('\n');

		case 'error':
			return [
				title,
				format(value, {
					default: {
						start: color.yellow(S.BAR),
					},
				}),
				data.error ??
					format(ctx.error, {
						default: {
							start: color.yellow(S.BAR),
							style: color.yellow,
						},
						lastLine: {
							start: color.yellow(S.BAR_END),
						},
					}),
			].join('\n');

		case 'submit':
			return [
				title,
				format(value, {
					default: {
						start: color.gray(S.BAR),
						style: color.dim,
					},
				}),
			].join('\n');

		default:
			return [
				color.gray(S.BAR),
				format(message, {
					firstLine: {
						start: symbol(ctx.state),
					},
					default: {
						start: color.cyan(S.BAR),
					},
				}),
				format(data.placeholder && !data.value ? placeholder : data.valueWithCursor ?? value, {
					default: {
						start: color.cyan(S.BAR),
					},
				}),
				color.cyan(S.BAR_END),
			].join('\n');
	}
}
