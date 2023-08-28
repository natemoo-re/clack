import {
	block,
	ConfirmPrompt,
	GroupMultiSelectPrompt,
	isCancel,
	MultiSelectPrompt,
	PasswordPrompt,
	Prompt,
	SelectKeyPrompt,
	SelectPrompt,
	State,
	strLength,
	TextPrompt
} from '@clack/core';
import isUnicodeSupported from 'is-unicode-supported';
import color from 'picocolors';
import { cursor, erase } from 'sisteransi';

const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);

const S_STEP_ACTIVE = s('◆', '*');
const S_STEP_CANCEL = s('■', 'x');
const S_STEP_ERROR = s('▲', 'x');
const S_STEP_SUBMIT = s('◇', 'o');

const S_BAR_START = s('┌', 'T');
const S_BAR = s('│', '|');
const S_BAR_END = s('└', '—');

const S_RADIO_ACTIVE = s('●', '>');
const S_RADIO_INACTIVE = s('○', ' ');
const S_CHECKBOX_ACTIVE = s('◻', '[•]');
const S_CHECKBOX_SELECTED = s('◼', '[+]');
const S_CHECKBOX_INACTIVE = s('◻', '[ ]');
const S_PASSWORD_MASK = s('▪', '•');

const S_BAR_H = s('─', '-');
const S_CORNER_TOP_RIGHT = s('╮', '+');
const S_CONNECT_LEFT = s('├', '+');
const S_CORNER_BOTTOM_RIGHT = s('╯', '+');

const S_INFO = s('●', '•');
const S_SUCCESS = s('◆', '*');
const S_WARN = s('▲', '!');
const S_ERROR = s('■', 'x');

const symbol = (state: State) => {
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

const format = Prompt.prototype.format;

interface ThemeParams {
	ctx: Omit<Prompt, 'prompt'>;
	message: string;
	value: string;
	valueWithCursor: string | undefined;
	placeholder?: string | undefined;
	error?: string | undefined;
}

function applyTheme(data: ThemeParams): string {
	const { ctx, message } = data;

	const title = [
		color.gray(S_BAR),
		format(message, {
			firstLine: {
				start: symbol(ctx.state),
			},
			default: {
				start: color.gray(S_BAR),
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
						start: color.gray(S_BAR),
						style: (line) => color.strikethrough(color.dim(line)),
					},
				}),
			].join('\n');

		case 'error':
			return [
				title,
				format(value, {
					default: {
						start: color.yellow(S_BAR),
					},
				}),
				data.error ??
					format(ctx.error, {
						default: {
							start: color.yellow(S_BAR),
							style: color.yellow,
						},
						lastLine: {
							start: color.yellow(S_BAR_END),
						},
					}),
			].join('\n');

		case 'submit':
			return [
				title,
				format(value, {
					default: {
						start: color.gray(S_BAR),
						style: color.dim,
					},
				}),
			].join('\n');

		default:
			return [
				color.gray(S_BAR),
				format(message, {
					firstLine: {
						start: symbol(ctx.state),
					},
					default: {
						start: color.cyan(S_BAR),
					},
				}),
				format(data.placeholder && !data.value ? placeholder : data.valueWithCursor ?? value, {
					default: {
						start: color.cyan(S_BAR),
					},
				}),
				color.cyan(S_BAR_END),
			].join('\n');
	}
}

export interface TextOptions {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	initialValue?: string;
	validate?: (value: string) => string | void;
}
export const text = (opts: TextOptions) => {
	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		render() {
			return applyTheme({
				ctx: this,
				message: opts.message,
				value: this.value,
				valueWithCursor: this.valueWithCursor,
				placeholder: opts.placeholder,
			});
		},
	}).prompt() as Promise<string | symbol>;
};

export interface PasswordOptions {
	message: string;
	mask?: string;
	validate?: (value: string) => string | void;
}
export const password = (opts: PasswordOptions) => {
	return new PasswordPrompt({
		validate: opts.validate,
		mask: opts.mask ?? S_PASSWORD_MASK,
		render() {
			return applyTheme({
				ctx: this,
				message: opts.message,
				value: this.valueWithCursor,
				valueWithCursor: this.valueWithCursor,
			});
		},
	}).prompt() as Promise<string | symbol>;
};

export interface ConfirmOptions {
	message: string;
	active?: string;
	inactive?: string;
	initialValue?: boolean;
}
export const confirm = (opts: ConfirmOptions) => {
	const active = opts.active ?? 'Yes';
	const inactive = opts.inactive ?? 'No';
	return new ConfirmPrompt({
		active,
		inactive,
		initialValue: opts.initialValue ?? true,
		render() {
			const opt = (state: boolean, message: string): string => {
				return state
					? `${color.green(S_RADIO_ACTIVE)} ${message}`
					: `${color.dim(S_RADIO_INACTIVE)} ${color.dim(message)}`;
			};
			return applyTheme({
				ctx: this,
				message: opts.message,
				value:
					this.state === 'submit' || this.state === 'cancel'
						? this.value
							? active
							: inactive
						: `${opt(!!this.value, active)} ${color.dim('/')} ${opt(!this.value, inactive)}`,
				valueWithCursor: undefined,
			});
		},
	}).prompt() as Promise<boolean | symbol>;
};

type Primitive = Readonly<string | boolean | number>;

type Option<Value> = Value extends Primitive
	? { value: Value; label?: string; hint?: string }
	: { value: Value; label: string; hint?: string };

export interface SelectOptions<Value> {
	message: string;
	options: Option<Value>[];
	initialValue?: Value;
	maxItems?: number;
}

export const select = <Value>(opts: SelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled'
	): string => {
		const label = option.label ?? String(option.value);
		if (state === 'active') {
			return `${color.green(S_RADIO_ACTIVE)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		} else if (state === 'selected') {
			return `${color.dim(label)}`;
		} else if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		}
		return `${color.dim(S_RADIO_INACTIVE)} ${color.dim(label)}`;
	};

	let slidingWindowLocation = 0;

	return new SelectPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			let value: string;
			switch (this.state) {
				case 'submit':
					value = opt(this.options[this.cursor], 'selected');
					break;
				case 'cancel':
					value = opt(this.options[this.cursor], 'cancelled');
					break;
				default:
					const maxItems = opts.maxItems === undefined ? Infinity : Math.max(opts.maxItems, 5);
					if (this.cursor >= slidingWindowLocation + maxItems - 3) {
						slidingWindowLocation = Math.max(
							Math.min(this.cursor - maxItems + 3, this.options.length - maxItems),
							0
						);
					} else if (this.cursor < slidingWindowLocation + 2) {
						slidingWindowLocation = Math.max(this.cursor - 2, 0);
					}

					const shouldRenderTopEllipsis =
						maxItems < this.options.length && slidingWindowLocation > 0;
					const shouldRenderBottomEllipsis =
						maxItems < this.options.length &&
						slidingWindowLocation + maxItems < this.options.length;

					value = this.options
						.slice(slidingWindowLocation, slidingWindowLocation + maxItems)
						.map((option, i, arr) => {
							if (i === 0 && shouldRenderTopEllipsis) {
								return color.dim('...');
							} else if (i === arr.length - 1 && shouldRenderBottomEllipsis) {
								return color.dim('...');
							} else {
								return opt(
									option,
									i + slidingWindowLocation === this.cursor ? 'active' : 'inactive'
								);
							}
						})
						.join('\n');
					break;
			}
			return applyTheme({
				ctx: this,
				message: opts.message,
				value,
				valueWithCursor: undefined,
			});
		},
	}).prompt() as Promise<Value | symbol>;
};

export const selectKey = <Value extends string>(opts: SelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'cancelled' = 'inactive'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'selected') {
			return `${color.dim(label)}`;
		} else if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		} else if (state === 'active') {
			return `${color.bgCyan(color.gray(` ${option.value} `))} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		}
		return `${color.gray(color.bgWhite(color.inverse(` ${option.value} `)))} ${label} ${
			option.hint ? color.dim(`(${option.hint})`) : ''
		}`;
	};

	return new SelectKeyPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}`;

			switch (this.state) {
				case 'submit':
					return `${title}\n${color.gray(S_BAR)}  ${opt(
						this.options.find((opt) => opt.value === this.value)!,
						'selected'
					)}`;
				case 'cancel':
					return `${title}\n${color.gray(S_BAR)}  ${opt(
						this.options[0],
						'cancelled'
					)}\n${color.gray(S_BAR)}`;
				default:
					return `${title}\n${color.cyan(S_BAR)}  ${this.options
						.map((option, i) => opt(option, i === this.cursor ? 'active' : 'inactive'))
						.join(`\n${color.cyan(S_BAR)}  `)}\n${color.cyan(S_BAR_END)}\n`;
			}
		},
	}).prompt() as Promise<Value | symbol>;
};

export interface MultiSelectOptions<Value> {
	message: string;
	options: Option<Value>[];
	initialValues?: Value[];
	required?: boolean;
	cursorAt?: Value;
}
export const multiselect = <Value>(opts: MultiSelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state: 'inactive' | 'active' | 'selected' | 'active-selected' | 'submitted' | 'cancelled'
	) => {
		const label = option.label ?? String(option.value);
		if (state === 'active') {
			return `${color.cyan(S_CHECKBOX_ACTIVE)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		} else if (state === 'selected') {
			return `${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`;
		} else if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		} else if (state === 'active-selected') {
			return `${color.green(S_CHECKBOX_SELECTED)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		} else if (state === 'submitted') {
			return `${color.dim(label)}`;
		}
		return `${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`;
	};

	return new MultiSelectPrompt({
		options: opts.options,
		initialValues: opts.initialValues,
		required: opts.required ?? true,
		cursorAt: opts.cursorAt,
		validate(selected: Value[]) {
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
			let value: string;
			let error: string | undefined;

			switch (this.state) {
				case 'submit': {
					value =
						this.options
							.filter(({ value }) => this.value.includes(value))
							.map((option) => opt(option, 'submitted'))
							.join(color.dim(', ')) || color.dim('none');
					break;
				}
				case 'cancel': {
					value =
						this.options
							.filter(({ value }) => this.value.includes(value))
							.map((option) => opt(option, 'cancelled'))
							.join(color.dim(', ')) ?? '';
				}
				case 'error': {
					error = format(
						this.error
							.split('\n')
							.map((ln, i) => (i === 0 ? color.yellow(ln) : ln))
							.join('\n'),
						{
							firstLine: {
								start: color.yellow(S_BAR_END),
							},
							default: {
								start: color.hidden('-'),
							},
						}
					);
					value = this.options
						.map((option, i) => {
							const selected = this.value.includes(option.value);
							const active = i === this.cursor;
							if (active && selected) {
								return opt(option, 'active-selected');
							} else if (selected) {
								return opt(option, 'selected');
							}
							return opt(option, active ? 'active' : 'inactive');
						})
						.join('\n');
					break;
				}
				default: {
					value = this.options
						.map((option, i) => {
							const selected = this.value.includes(option.value);
							const active = i === this.cursor;
							if (active && selected) {
								return opt(option, 'active-selected');
							} else if (selected) {
								return opt(option, 'selected');
							} else {
								return opt(option, active ? 'active' : 'inactive');
							}
						})
						.join('\n');
				}
			}
			return applyTheme({
				ctx: this,
				message: opts.message,
				value,
				error,
				valueWithCursor: undefined,
			});
		},
	}).prompt() as Promise<Value[] | symbol>;
};

export interface GroupMultiSelectOptions<Value> {
	message: string;
	options: Record<string, Option<Value>[]>;
	initialValues?: Value[];
	required?: boolean;
	cursorAt?: Value;
}
export const groupMultiselect = <Value>(opts: GroupMultiSelectOptions<Value>) => {
	const opt = (
		option: Option<Value>,
		state:
			| 'inactive'
			| 'active'
			| 'selected'
			| 'active-selected'
			| 'group-active'
			| 'group-active-selected'
			| 'submitted'
			| 'cancelled',
		options: Option<Value>[] = []
	) => {
		const label = option.label ?? String(option.value);
		const isItem = typeof (option as any).group === 'string';
		const next = isItem && (options[options.indexOf(option) + 1] ?? { group: true });
		const isLast = isItem && (next as any).group === true;
		const prefix = isItem ? `${isLast ? S_BAR_END : S_BAR} ` : '';

		if (state === 'active') {
			return `${color.dim(prefix)}${color.cyan(S_CHECKBOX_ACTIVE)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		} else if (state === 'group-active') {
			return `${prefix}${color.cyan(S_CHECKBOX_ACTIVE)} ${color.dim(label)}`;
		} else if (state === 'group-active-selected') {
			return `${prefix}${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`;
		} else if (state === 'selected') {
			return `${color.dim(prefix)}${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`;
		} else if (state === 'cancelled') {
			return `${color.strikethrough(color.dim(label))}`;
		} else if (state === 'active-selected') {
			return `${color.dim(prefix)}${color.green(S_CHECKBOX_SELECTED)} ${label} ${
				option.hint ? color.dim(`(${option.hint})`) : ''
			}`;
		} else if (state === 'submitted') {
			return `${color.dim(label)}`;
		}
		return `${color.dim(prefix)}${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`;
	};

	return new GroupMultiSelectPrompt({
		options: opts.options,
		initialValues: opts.initialValues,
		required: opts.required ?? true,
		cursorAt: opts.cursorAt,
		validate(selected: Value[]) {
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
			let title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${opts.message}`;

			switch (this.state) {
				case 'submit': {
					return `${title}\n${color.gray(S_BAR)}  ${this.options
						.filter(({ value }) => this.value.includes(value))
						.map((option) => opt(option, 'submitted'))
						.join(color.dim(', '))}`;
				}
				case 'cancel': {
					const label = this.options
						.filter(({ value }) => this.value.includes(value))
						.map((option) => opt(option, 'cancelled'))
						.join(color.dim(', '));
					return `${title}\n${color.gray(S_BAR)}  ${
						label.trim() ? `${label}\n${color.gray(S_BAR)}` : ''
					}`;
				}
				case 'error': {
					const footer = this.error
						.split('\n')
						.map((ln, i) =>
							i === 0 ? `${color.yellow(S_BAR_END)}  ${color.yellow(ln)}` : `   ${ln}`
						)
						.join('\n');
					return `${title}\n${color.yellow(S_BAR)}  ${this.options
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
					return `${title}\n${color.cyan(S_BAR)}  ${this.options
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
	}).prompt() as Promise<Value[] | symbol>;
};

export const note = (message = '', title = '') => {
	const maxWidth = Math.floor((process.stdout.columns ?? 80) * 0.8);
	const lines = format(message, {
		default: {
			start: color.gray(S_BAR),
		},
		maxWidth: maxWidth - 2,
	}).split(/\n/g);
	const titleLen = strLength(title);
	const messageLen = lines.reduce((sum, line) => {
		const length = strLength(line);
		return length > sum ? length : sum;
	}, 0);
	const len = Math.min(Math.max(messageLen, titleLen) + 2, maxWidth);
	const noteBox = [
		color.gray(S_BAR),
		`${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(
			S_BAR_H.repeat(Math.max(len - titleLen - 3, 0)) + S_CORNER_TOP_RIGHT
		)}`,
		color.gray(S_BAR + ' '.repeat(len) + S_BAR),
		lines
			.map((line) => line + ' '.repeat(Math.max(len + 1 - strLength(line), 0)) + color.gray(S_BAR))
			.join('\n'),
		color.gray(S_BAR + ' '.repeat(len) + S_BAR),
		color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(len) + S_CORNER_BOTTOM_RIGHT),
		'',
	].join('\n');
	process.stdout.write(noteBox);
};

export const cancel = (message = '') => {
	process.stdout.write(
		format(message, {
			default: {
				start: color.gray(S_BAR),
				style: color.red,
			},
			lastLine: {
				start: color.gray(S_BAR_END),
			},
		}) + '\n\n'
	);
};

export const intro = (title = '') => {
	process.stdout.write(
		format(title, {
			firstLine: {
				start: color.gray(S_BAR_START),
			},
			default: {
				start: color.gray(S_BAR),
			},
		}) + '\n'
	);
};

export const outro = (message = '') => {
	process.stdout.write(
		[
			color.gray(S_BAR),
			format(message, {
				default: {
					start: color.gray(S_BAR),
				},
				lastLine: {
					start: color.gray(S_BAR_END),
				},
			}),
			'',
			'',
		].join('\n')
	);
};

export type LogMessageOptions = {
	symbol?: string;
};
export const log = {
	message: (message = '', { symbol = color.gray(S_BAR) }: LogMessageOptions = {}) => {
		process.stdout.write(
			format(message, {
				firstLine: {
					start: symbol,
				},
				default: {
					start: color.gray(S_BAR),
				},
			}) + '\n'
		);
	},
	info: (message: string) => {
		log.message(message, {
			symbol: color.blue(S_INFO),
		});
	},
	success: (message: string) => {
		log.message(message, {
			symbol: color.green(S_SUCCESS),
		});
	},
	step: (message: string) => {
		log.message(message, {
			symbol: color.green(S_STEP_SUBMIT),
		});
	},
	warn: (message: string) => {
		log.message(message, {
			symbol: color.yellow(S_WARN),
		});
	},
	/** alias for `log.warn()`. */
	warning: (message: string) => {
		log.warn(message);
	},
	error: (message: string) => {
		log.message(message, {
			symbol: color.red(S_ERROR),
		});
	},
};

export const spinner = () => {
	const frames = unicode ? ['◒', '◐', '◓', '◑'] : ['•', 'o', 'O', '0'];
	const delay = unicode ? 80 : 120;

	let unblock: () => void;
	let loop: NodeJS.Timeout;
	let isSpinnerActive: boolean = false;
	let _message: string = '';
	let _prevMessage: string = '';

	const formatMessage = (symbol: string, msg: string): string => {
		return format(msg, {
			firstLine: {
				start: symbol,
			},
			default: {
				start: color.gray(S_BAR),
			},
		});
	};

	const clearPrevMessage = (): void => {
		const linesCounter = _prevMessage.split(/\n/g).length;
		process.stdout.write(cursor.move(-999, (linesCounter - 1) * -1));
		process.stdout.write(erase.down(linesCounter));
	};

	const handleExit = (code: number) => {
		const msg = code > 1 ? 'Something went wrong' : 'Canceled';
		if (isSpinnerActive) stop(msg, code);
	};

	const errorEventHandler = () => handleExit(2);
	const signalEventHandler = () => handleExit(1);

	const registerHooks = () => {
		// Reference: https://nodejs.org/api/process.html#event-uncaughtexception
		process.on('uncaughtExceptionMonitor', errorEventHandler);
		// Reference: https://nodejs.org/api/process.html#event-unhandledrejection
		process.on('unhandledRejection', errorEventHandler);
		// Reference Signal Events: https://nodejs.org/api/process.html#signal-events
		process.on('SIGINT', signalEventHandler);
		process.on('SIGTERM', signalEventHandler);
		process.on('exit', handleExit);
	};

	const clearHooks = () => {
		process.removeListener('uncaughtExceptionMonitor', errorEventHandler);
		process.removeListener('unhandledRejection', errorEventHandler);
		process.removeListener('SIGINT', signalEventHandler);
		process.removeListener('SIGTERM', signalEventHandler);
		process.removeListener('exit', handleExit);
	};

	const start = (msg: string = ''): void => {
		isSpinnerActive = true;
		unblock = block();
		_message = msg.replace(/\.+$/, '');
		process.stdout.write(`${color.gray(S_BAR)}\n`);
		let frameIndex = 0;
		let dotsTimer = 0;
		registerHooks();
		loop = setInterval(() => {
			clearPrevMessage();
			const frame = color.magenta(frames[frameIndex]);
			const loadingDots = '.'.repeat(Math.floor(dotsTimer)).slice(0, 3);
			const newMessage = formatMessage(frame, _message + loadingDots);
			_prevMessage = newMessage;
			process.stdout.write(newMessage);
			frameIndex = frameIndex + 1 < frames.length ? frameIndex + 1 : 0;
			dotsTimer = dotsTimer < frames.length ? dotsTimer + 0.125 : 0;
		}, delay);
	};

	const stop = (msg: string = '', code: number = 0): void => {
		isSpinnerActive = false;
		clearInterval(loop);
		clearPrevMessage();
		const step =
			code === 0
				? color.green(S_STEP_SUBMIT)
				: code === 1
				? color.red(S_STEP_CANCEL)
				: color.red(S_STEP_ERROR);
		_message = formatMessage(step, msg || _message);
		process.stdout.write(_message + '\n');
		clearHooks();
		unblock();
	};

	const message = (msg: string = ''): void => {
		_message = msg || _message;
	};

	return {
		start,
		stop,
		message,
	};
};

export type PromptGroupAwaitedReturn<T> = {
	[P in keyof T]: Exclude<Awaited<T[P]>, symbol>;
};

export interface PromptGroupOptions<T> {
	/**
	 * Control how the group can be canceled
	 * if one of the prompts is canceled.
	 */
	onCancel?: (opts: { results: Prettify<Partial<PromptGroupAwaitedReturn<T>>> }) => void;
}

type Prettify<T> = {
	[P in keyof T]: T[P];
} & {};

export type PromptGroup<T> = {
	[P in keyof T]: (opts: {
		results: Prettify<Partial<PromptGroupAwaitedReturn<Omit<T, P>>>>;
	}) => void | Promise<T[P] | void>;
};

/**
 * Define a group of prompts to be displayed
 * and return a results of objects within the group
 */
export const group = async <T>(
	prompts: PromptGroup<T>,
	opts?: PromptGroupOptions<T>
): Promise<Prettify<PromptGroupAwaitedReturn<T>>> => {
	const results = {} as any;
	const promptNames = Object.keys(prompts);

	for (const name of promptNames) {
		const prompt = prompts[name as keyof T];
		const result = await prompt({ results })?.catch((e) => {
			throw e;
		});

		// Pass the results to the onCancel function
		// so the user can decide what to do with the results
		// TODO: Switch to callback within core to avoid isCancel Fn
		if (typeof opts?.onCancel === 'function' && isCancel(result)) {
			results[name] = 'canceled';
			opts.onCancel({ results });
			continue;
		}

		results[name] = result;
	}

	return results;
};
