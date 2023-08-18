import isUnicodeSupported from 'is-unicode-supported';

const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);

export const STEP_ACTIVE = s('◆', '*');
export const STEP_CANCEL = s('■', 'x');
export const STEP_ERROR = s('▲', 'x');
export const STEP_SUBMIT = s('◇', 'o');

export const BAR_START = s('┌', 'T');
export const BAR = s('│', '|');
export const BAR_END = s('└', '—');

export const RADIO_ACTIVE = s('●', '>');
export const RADIO_INACTIVE = s('○', ' ');
export const CHECKBOX_ACTIVE = s('◻', '[•]');
export const CHECKBOX_SELECTED = s('◼', '[+]');
export const CHECKBOX_INACTIVE = s('◻', '[ ]');
export const PASSWORD_MASK = s('▪', '•');

export const BAR_H = s('─', '-');
export const CORNER_TOP_RIGHT = s('╮', '+');
export const CONNECT_LEFT = s('├', '+');
export const CORNER_BOTTOM_RIGHT = s('╯', '+');

export const INFO = s('●', '•');
export const SUCCESS = s('◆', '*');
export const WARN = s('▲', '!');
export const ERROR = s('■', 'x');
