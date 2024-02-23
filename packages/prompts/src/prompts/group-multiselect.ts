import { GroupMultiSelectPrompt } from '@clack/core';
import color from 'picocolors';
import {
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
	state:
		| 'inactive'
		| 'active'
		| 'selected'
		| 'active-selected'
		| 'group-active'
		| 'group-active-selected'
		| 'submitted'
		| 'cancelled',
	options: Option<TValue>[] = []
) => {
	const label = option.label ?? String(option.value);
	const isItem = typeof (option as any).group === 'string';
	const next = isItem && (options[options.indexOf(option) + 1] ?? { group: true });
	const isLast = isItem && (next as any).group === true;
	const prefix = isItem ? `${isLast ? S_BAR_END : S_BAR} ` : '';

	if (state === 'group-active') {
		return `${prefix}${color.cyan(S_CHECKBOX_ACTIVE)} ${color.dim(label)}`;
	} else if (state === 'group-active-selected') {
		return `${prefix}${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`;
	} else if (state === 'active') {
		return `${color.dim(prefix)}${color.cyan(S_CHECKBOX_ACTIVE)} ${label}${
			option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
		}`;
	} else if (state === 'active-selected') {
		return `${color.dim(prefix)}${color.green(S_CHECKBOX_SELECTED)} ${label}${
			option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
		}`;
	} else if (state === 'selected') {
		return `${color.dim(prefix)}${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`;
	} else if (state === 'cancelled') {
		return `${color.strikethrough(color.dim(label))}`;
	} else if (state === 'submitted') {
		return `${color.dim(label)}`;
	}
	return `${color.dim(prefix)}${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`;
};

export interface GroupMultiSelectOptions<TValue> {
	message: string;
	options: Record<string, Option<TValue>[]>;
	initialValues?: TValue[];
	required?: boolean;
	cursorAt?: TValue;
}

const groupMultiselect = <TValue>(opts: GroupMultiSelectOptions<TValue>) => {
	return new GroupMultiSelectPrompt({
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
					return `${title}${color.yellow(S_BAR)}  ${this.options
						.map((option, i, options) => {
							const selected =
								this.value.includes(option.value) ||
								(option.group === true && this.isGroupSelected(`${option.value}`));
							const active = i === this.cursor;
							const groupActive =
								!active &&
								typeof option.group === 'string' &&
								this.options[this.cursor].value === option.group;
							if (groupActive) {
								return opt(option, selected ? 'group-active-selected' : 'group-active', options);
							}
							if (active && selected) {
								return opt(option, 'active-selected', options);
							}
							if (selected) {
								return opt(option, 'selected', options);
							}
							return opt(option, active ? 'active' : 'inactive', options);
						})
						.join(`\n${color.yellow(S_BAR)}  `)}\n${footer}\n`;
				}
				default: {
					return `${title}${color.cyan(S_BAR)}  ${this.options
						.map((option, i, options) => {
							const selected =
								this.value.includes(option.value) ||
								(option.group === true && this.isGroupSelected(`${option.value}`));
							const active = i === this.cursor;
							const groupActive =
								!active &&
								typeof option.group === 'string' &&
								this.options[this.cursor].value === option.group;
							if (groupActive) {
								return opt(option, selected ? 'group-active-selected' : 'group-active', options);
							}
							if (active && selected) {
								return opt(option, 'active-selected', options);
							}
							if (selected) {
								return opt(option, 'selected', options);
							}
							return opt(option, active ? 'active' : 'inactive', options);
						})
						.join(`\n${color.cyan(S_BAR)}  `)}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<TValue[] | symbol>;
};

export default groupMultiselect;
