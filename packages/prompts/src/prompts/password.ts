import { PasswordPrompt } from '@clack/core';
import color from 'picocolors';
import { symbol, S_BAR, S_BAR_END, S_PASSWORD_MASK } from '../utils';

export interface PasswordOptions {
	message: string;
	mask?: string;
	validate?: (value: string) => string | void;
}

const password = (opts: PasswordOptions) => {
	return new PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? S_PASSWORD_MASK,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}\n`;
			const masked = this.valueWithCursor;

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n${color.yellow(S_BAR)}  ${masked}\n${color.yellow(
						S_BAR_END
					)}  ${color.yellow(this.error)}\n`;
				case 'submit':
					return `${title}${color.gray(S_BAR)}  ${color.dim(masked)}`;
				case 'cancel':
					return `${title}${color.gray(S_BAR)}  ${
						masked ? color.strikethrough(color.dim(masked)) : ''
					}${masked ? '\n' + color.gray(S_BAR) : ''}`;
				default:
					return `${title}${color.cyan(S_BAR)}  ${masked}\n${color.cyan(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
};

export default password;
