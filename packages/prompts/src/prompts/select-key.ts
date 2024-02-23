import { SelectKeyPrompt } from '@clack/core';
import color from 'picocolors';
import { Option, SelectOptions, symbol, S_BAR, S_BAR_END } from '../utils';

export const opt = <TValue>(
	option: Option<TValue>,
	state: 'inactive' | 'active' | 'selected' | 'cancelled' = 'inactive'
) => {
	const label = option.label ?? String(option.value);
	if (state === 'selected') {
		return `${color.dim(label)}`;
	} else if (state === 'cancelled') {
		return `${color.strikethrough(color.dim(label))}`;
	} else if (state === 'active') {
		return `${color.bgCyan(color.gray(` ${option.value} `))} ${label}${
			option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
		}`;
	}
	return `${color.gray(color.bgWhite(color.inverse(` ${option.value} `)))} ${label}${
		option.hint ? ` ${color.dim(`(${option.hint})`)}` : ''
	}`;
};

const selectKey = <TValue extends string>(opts: SelectOptions<TValue>) => {
	return new SelectKeyPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;

			switch (this.state) {
				case 'submit':
					return `${title}${color.gray(S_BAR)}  ${opt(
						this.options.find((opt) => opt.value === this.value)!,
						'selected'
					)}`;
				case 'cancel':
					return `${title}${color.gray(S_BAR)}  ${opt(this.options[0], 'cancelled')}\n${color.gray(
						S_BAR
					)}`;
				default: {
					return `${title}${color.cyan(S_BAR)}  ${this.options
						.map((option, i) => opt(option, i === this.cursor ? 'active' : 'inactive'))
						.join(`\n${color.cyan(S_BAR)}  `)}\n${color.cyan(S_BAR_END)}\n`;
				}
			}
		},
	}).prompt() as Promise<TValue | symbol>;
};

export default selectKey;
