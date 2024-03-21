import { State } from '@clack/core';
import isUnicodeSupportedFn from 'is-unicode-supported';
import color from 'picocolors';

export const isUnicodeSupported = isUnicodeSupportedFn();
const s = (c: string, fallback: string) => (isUnicodeSupported ? c : fallback);

export const S_STEP_ACTIVE = s('◆', '*');
export const S_STEP_CANCEL = s('■', 'x');
export const S_STEP_ERROR = s('▲', 'x');
export const S_STEP_SUBMIT = s('◇', 'o');

export const S_BAR_START = s('┌', 'T');
export const S_BAR = s('│', '|');
export const S_BAR_END = s('└', '—');

export const S_RADIO_ACTIVE = s('●', '>');
export const S_RADIO_INACTIVE = s('○', ' ');
export const S_CHECKBOX_ACTIVE = s('◻', '[•]');
export const S_CHECKBOX_SELECTED = s('◼', '[+]');
export const S_CHECKBOX_INACTIVE = s('◻', '[ ]');
export const S_PASSWORD_MASK = s('▪', '•');

export const S_BAR_H = s('─', '-');
export const S_CORNER_TOP_RIGHT = s('╮', '+');
export const S_CONNECT_LEFT = s('├', '+');
export const S_CORNER_BOTTOM_RIGHT = s('╯', '+');

export const S_INFO = s('●', '•');
export const S_SUCCESS = s('◆', '*');
export const S_WARN = s('▲', '!');
export const S_ERROR = s('■', 'x');

export const symbol = (state: State) => {
	switch (state) {
		case 'initial':
		case 'active':
			return color.cyan(S_STEP_ACTIVE);
		case 'cancel':
			return color.red(S_STEP_CANCEL);
		case 'error':
			return color.yellow(S_STEP_ERROR);
		case 'submit':
			return color.green(S_STEP_SUBMIT);
	}
};
