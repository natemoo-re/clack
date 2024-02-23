import { SelectPrompt } from '@clack/core';
import color from 'picocolors';
import {
	limitOptions,
	Option,
	SelectOptions,
	symbol,
	S_BAR,
	S_BAR_END,
	S_RADIO_ACTIVE,
	S_RADIO_INACTIVE
} from '../utils';

export const opt = <TValue>(
	option: Option<TValue>,
	state: 'inactive' | 'active' | 'selected' | 'cancelled'
) => {
	const label = option.label ?? String(option.value);
	switch (state) {
		case 'selected':
			return `${color.dim(label)}`;
		case 'active':
			return `${color.green(S_RADIO_ACTIVE)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		case 'cancelled':
			return `${color.strikethrough(color.dim(label))}`;
		default:
			return `${color.dim(S_RADIO_INACTIVE)} ${color.dim(label)}`;
	}
};

const select = <TValue>(opts: SelectOptions<TValue>) => {
	return new SelectPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			switch (this.state) {
				case 'submit':
					return `${title}${color.gray(S_BAR)}  ${opt(this.options[this.cursor], 'selected')}`;
				case 'cancel':
					return `${title}${color.gray(S_BAR)}  ${opt(
						this.options[this.cursor],
						'cancelled'
					)}\n${color.gray(S_BAR)}`;
				default:
					return `${title}${color.cyan(S_BAR)}  ${limitOptions({
						cursor: this.cursor,
						options: this.options,
						maxItems: opts.maxItems,
						style: (item, active) => opt(item, active ? 'active' : 'inactive'),
					}).join(`\n${color.cyan(S_BAR)}  `)}\n${color.cyan(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<TValue | symbol>;
};

export default select;
