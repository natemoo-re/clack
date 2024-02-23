import { MultiSelectPrompt } from '@clack/core';
import color from 'picocolors';
import {
	limitOptions,
	Option,
	symbol,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_ACTIVE,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED
} from '../utils';

export const opt = <TValue>(
	option: Option<TValue>,
	state: 'inactive' | 'active' | 'selected' | 'active-selected' | 'submitted' | 'cancelled'
) => {
	const label = option.label ?? String(option.value);
	if (state === 'active') {
		return `${color.cyan(S_CHECKBOX_ACTIVE)} ${label}${
			option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
		}`;
	} else if (state === 'selected') {
		return `${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`;
	} else if (state === 'cancelled') {
		return `${color.strikethrough(color.dim(label))}`;
	} else if (state === 'active-selected') {
		return `${color.green(S_CHECKBOX_SELECTED)} ${label}${
			option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
		}`;
	} else if (state === 'submitted') {
		return `${color.dim(label)}`;
	}
	return `${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`;
};

export interface MultiSelectOptions<TValue> {
	message: string;
	options: Option<TValue>[];
	initialValues?: TValue[];
	maxItems?: number;
	required?: boolean;
	cursorAt?: TValue;
}

const multiselect = <TValue>(opts: MultiSelectOptions<TValue>) => {
	return new MultiSelectPrompt({
		options: opts.options,
		initialValues: opts.initialValues,
		required: opts.required ?? true,
		cursorAt: opts.cursorAt,
		validate(selected: TValue[]) {
			if (this.required && selected.length === 0)
				return `Please select at least one option.\n${color.reset(
					color.dim(
						`Press ${color.gray(color.bgWhite(color.inverse(' space ')))} to select, ${color.gray(
							color.bgWhite(color.inverse(' enter '))
						)} to submit`
					)
				)}`;
		},
		render() {
			let title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			const styleOption = (option: Option<TValue>, active: boolean) => {
				const selected = this.value.includes(option.value);
				if (active && selected) {
					return opt(option, 'active-selected');
				}
				if (selected) {
					return opt(option, 'selected');
				}
				return opt(option, active ? 'active' : 'inactive');
			};

			switch (this.state) {
				case 'submit': {
					return `${title}${color.gray(S_BAR)}  ${this.options
						.filter(({ value }) => this.value.includes(value))
						.map((option) => opt(option, 'submitted'))
						.join(color.dim(', '))}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value }) => this.value.includes(value))
						.map((option) => opt(option, 'cancelled'))
						.join(color.dim(', '));
					return `${title}${color.gray(S_BAR)}  ${
						label.trim() ? `${label}\n${color.gray(S_BAR)}` : ''
					}`;
				}
				case 'error': {
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0
								? `${color.yellow(S_BAR_END)}  ${color.yellow(ln)}`
								: `${color.hidden('-')}  ${ln}`
						)
						.join('\n');
					return (
						title +
						color.yellow(S_BAR) +
						'  ' +
						limitOptions({
							options: this.options,
							cursor: this.cursor,
							maxItems: opts.maxItems,
							style: styleOption,
						}).join(`\n${color.yellow(S_BAR)}  `) +
						'\n' +
						footer +
						'\n'
					);
				}
				default: {
					return `${title}${color.cyan(S_BAR)}  ${limitOptions({
						options: this.options,
						cursor: this.cursor,
						maxItems: opts.maxItems,
						style: styleOption,
					}).join(`\n${color.cyan(S_BAR)}  `)}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<TValue[] | symbol>;
};

export default multiselect;
