import type { Key, ReadLine } from 'node:readline';

import { stdin, stdout } from 'node:process';
import readline from 'node:readline';
import { Readable, Writable } from 'node:stream';
import { WriteStream } from 'node:tty';
import { cursor, erase } from 'sisteransi';
import wrap from 'wrap-ansi';
import { strLength } from '../utils';

function diffLines(a: string, b: string) {
	if (a === b) return;

	const aLines = a.split('\n');
	const bLines = b.split('\n');
	const diff: number[] = [];

	for (let i = 0; i < Math.max(aLines.length, bLines.length); i++) {
		if (aLines[i] !== bLines[i]) diff.push(i);
	}

	return diff;
}

const cancel = Symbol('clack:cancel');
export function isCancel(value: unknown): value is symbol {
	return value === cancel;
}

function setRawMode(input: Readable, value: boolean) {
	if ((input as typeof stdin).isTTY) (input as typeof stdin).setRawMode(value);
}

const aliases = new Map([
	['k', 'up'],
	['j', 'down'],
	['h', 'left'],
	['l', 'right'],
]);
const keys = new Set(['up', 'down', 'left', 'right', 'space', 'enter']);

export interface PromptOptions<Self extends Prompt> {
	render(this: Omit<Self, 'prompt'>): string | void;
	placeholder?: string;
	initialValue?: any;
	validate?: ((value: any) => string | void) | undefined;
	input?: Readable;
	output?: Writable;
	debug?: boolean;
}

export type State = 'initial' | 'active' | 'cancel' | 'submit' | 'error';

export type LineOption = 'firstLine' | 'newLine' | 'lastLine';

export interface FormatLineOptions {
	/**
	 * Define the start of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		start: '-'
	 * 	}
	 * })
	 * //=> '- foo'
	 */
	start: string;
	/**
	 * Define the end of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		end: '-'
	 * 	}
	 * })
	 * //=> 'foo -'
	 */
	end: string;
	/**
	 * Define the sides of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		sides: '-'
	 * 	}
	 * })
	 * //=> '- foo -'
	 */
	sides: string;
	/**
	 * Define the style of line
	 * @example
	 * format('foo', {
	 * 	line: {
	 * 		style: (line) => `(${line})`
	 * 	}
	 * })
	 * //=> '(foo)'
	 */
	style: (line: string) => string;
}

export interface FormatOptions extends Record<LineOption, Partial<FormatLineOptions>> {
	/**
	 * Shorthand to define values for each line
	 * @example
	 * format('foo', {
	 * 	default: {
	 * 		start: '-'
	 * 	}
	 * // equals
	 * 	firstLine{
	 * 		start: '-'
	 * 	},
	 * 	newLine{
	 * 		start: '-'
	 * 	},
	 * 	lastLine{
	 * 		start: '-'
	 * 	},
	 * })
	 */
	default: Partial<FormatLineOptions>;
	/**
	 * Define the max width of each line
	 * @example
	 * format('foo bar baz', {
	 * 	maxWidth: 7
	 * })
	 * //=> 'foo bar\nbaz'
	 */
	maxWidth: number;
}

export default class Prompt {
	protected input: Readable;
	protected output: Writable;
	private rl!: ReadLine;
	private opts: Omit<PromptOptions<Prompt>, 'render' | 'input' | 'output'>;
	private _track: boolean = false;
	private _render: (context: Omit<Prompt, 'prompt'>) => string | void;
	protected _cursor: number = 0;

	public state: State = 'initial';
	public value: any;
	public error: string = '';

	constructor(
		{ render, input = stdin, output = stdout, ...opts }: PromptOptions<Prompt>,
		trackValue: boolean = true
	) {
		this.opts = opts;
		this.onKeypress = this.onKeypress.bind(this);
		this.close = this.close.bind(this);
		this.render = this.render.bind(this);
		this._render = render.bind(this);
		this._track = trackValue;

		this.input = input;
		this.output = output;
	}

	public prompt() {
		const sink = new WriteStream(0);
		sink._write = (chunk, encoding, done) => {
			if (this._track) {
				this.value = this.rl.line.replace(/\t/g, '');
				this._cursor = this.rl.cursor;
				this.emit('value', this.value);
			}
			done();
		};
		this.input.pipe(sink);

		this.rl = readline.createInterface({
			input: this.input,
			output: sink,
			tabSize: 2,
			prompt: '',
			escapeCodeTimeout: 50,
		});
		readline.emitKeypressEvents(this.input, this.rl);
		this.rl.prompt();
		if (this.opts.initialValue !== undefined && this._track) {
			this.rl.write(this.opts.initialValue);
		}

		this.input.on('keypress', this.onKeypress);
		setRawMode(this.input, true);
		this.output.on('resize', this.render);

		this.render();

		return new Promise<string | symbol>((resolve, reject) => {
			this.once('submit', () => {
				this.output.write(cursor.show);
				this.output.off('resize', this.render);
				setRawMode(this.input, false);
				resolve(this.value);
			});
			this.once('cancel', () => {
				this.output.write(cursor.show);
				this.output.off('resize', this.render);
				setRawMode(this.input, false);
				resolve(cancel);
			});
		});
	}

	private subscribers = new Map<string, { cb: (...args: any) => any; once?: boolean }[]>();
	public on(event: string, cb: (...args: any) => any) {
		const arr = this.subscribers.get(event) ?? [];
		arr.push({ cb });
		this.subscribers.set(event, arr);
	}
	public once(event: string, cb: (...args: any) => any) {
		const arr = this.subscribers.get(event) ?? [];
		arr.push({ cb, once: true });
		this.subscribers.set(event, arr);
	}
	public emit(event: string, ...data: any[]) {
		const cbs = this.subscribers.get(event) ?? [];
		const cleanup: (() => void)[] = [];
		for (const subscriber of cbs) {
			subscriber.cb(...data);
			if (subscriber.once) {
				cleanup.push(() => cbs.splice(cbs.indexOf(subscriber), 1));
			}
		}
		for (const cb of cleanup) {
			cb();
		}
	}
	private unsubscribe() {
		this.subscribers.clear();
	}

	private onKeypress(char: string, key?: Key) {
		if (this.state === 'error') {
			this.state = 'active';
		}
		if (key?.name && !this._track && aliases.has(key.name)) {
			this.emit('cursor', aliases.get(key.name));
		}
		if (key?.name && keys.has(key.name)) {
			this.emit('cursor', key.name);
		}
		if (char && (char.toLowerCase() === 'y' || char.toLowerCase() === 'n')) {
			this.emit('confirm', char.toLowerCase() === 'y');
		}
		if (char) {
			this.emit('key', char.toLowerCase());
		}

		if (key?.name === 'return') {
			if (this.opts.validate) {
				const problem = this.opts.validate(this.value);
				if (problem) {
					this.error = problem;
					this.state = 'error';
					this.rl.write(this.value);
				}
			}
			if (this.state !== 'error') {
				this.state = 'submit';
			}
		}
		if (char === '\x03') {
			this.state = 'cancel';
		}
		if (this.state === 'submit' || this.state === 'cancel') {
			this.emit('finalize');
		}
		this.render();
		if (this.state === 'submit' || this.state === 'cancel') {
			this.close();
		}
	}

	protected close() {
		this.input.unpipe();
		this.input.removeListener('keypress', this.onKeypress);
		this.output.write('\n');
		setRawMode(this.input, false);
		this.rl.close();
		this.emit(`${this.state}`, this.value);
		this.unsubscribe();
	}

	private restoreCursor() {
		const lines =
			wrap(this._prevFrame, process.stdout.columns, { hard: true }).split('\n').length - 1;
		this.output.write(cursor.move(-999, lines * -1));
	}

	public format(text: string, options?: Partial<FormatOptions>): string {
		const getLineOption = <TLine extends LineOption, TKey extends keyof FormatLineOptions>(
			line: TLine,
			key: TKey
		): NonNullable<FormatOptions[TLine][TKey]> => {
			return (
				key === 'style'
					? options?.[line]?.[key] ?? ((line) => line)
					: options?.[line]?.[key] ?? options?.[line]?.sides ?? options?.default?.[key] ?? ''
			) as NonNullable<FormatOptions[TLine][TKey]>;
		};
		const getLineOptions = (line: LineOption): Omit<FormatLineOptions, 'sides'> => {
			return {
				start: getLineOption(line, 'start'),
				end: getLineOption(line, 'end'),
				style: getLineOption(line, 'style'),
			};
		};

		const firstLine = getLineOptions('firstLine');
		const newLine = getLineOptions('newLine');
		const lastLine = getLineOptions('lastLine');

		const emptySlots =
			Math.max(
				strLength(firstLine.start + firstLine.end),
				strLength(newLine.start + newLine.end),
				strLength(lastLine.start + lastLine.end)
			) + 2;
		const terminalWidth = process.stdout.columns || 80;
		const maxWidth = options?.maxWidth ?? terminalWidth;

		const formattedLines: string[] = [];
		const paragraphs = text.split(/\n/g);

		for (let i = 0; i < paragraphs.length; i++) {
			let currentLine = '';

			const words = paragraphs[i].split(/\s/g);
			for (const word of words) {
				if (strLength(currentLine + word) + emptySlots + 1 <= maxWidth) {
					currentLine += ` ${word}`;
				} else if (strLength(word) + emptySlots >= maxWidth) {
					const splitIndex = maxWidth - strLength(currentLine) - emptySlots - 1;
					formattedLines.push(currentLine + ' ' + word.slice(0, splitIndex));

					const chunkLength = maxWidth - emptySlots;
					let chunk = word.slice(splitIndex);
					while (strLength(chunk) > chunkLength) {
						formattedLines.push(chunk.slice(0, chunkLength));
						chunk = chunk.slice(chunkLength);
					}
					currentLine = chunk;
				} else {
					formattedLines.push(currentLine);
					currentLine = word;
				}
			}

			formattedLines.push(currentLine);
		}

		return formattedLines
			.map((line, i, ar) => {
				const opt = <TPosition extends Exclude<keyof FormatLineOptions, 'sides'>>(
					position: TPosition
				): FormatLineOptions[TPosition] => {
					return (
						i === 0 && ar.length === 1
							? options?.firstLine?.[position] ??
							  options?.lastLine?.[position] ??
							  firstLine[position]
							: i === 0
							? firstLine[position]
							: i + 1 === ar.length
							? lastLine[position]
							: newLine[position]
					) as FormatLineOptions[TPosition];
				};
				const startLine = opt('start');
				const endLine = opt('end');
				const styleLine = opt('style');
				return [startLine, styleLine(line), endLine].join(' ');
			})
			.join('\n');
	}

	private _prevFrame = '';
	private render() {
		const frame = wrap(this._render(this) ?? '', process.stdout.columns, { hard: true });
		if (frame === this._prevFrame) return;

		if (this.state === 'initial') {
			this.output.write(cursor.hide);
		} else {
			const diff = diffLines(this._prevFrame, frame);
			this.restoreCursor();
			// If a single line has changed, only update that line
			if (diff && diff?.length === 1) {
				const diffLine = diff[0];
				this.output.write(cursor.move(0, diffLine));
				this.output.write(erase.lines(1));
				const lines = frame.split('\n');
				this.output.write(lines[diffLine]);
				this._prevFrame = frame;
				this.output.write(cursor.move(0, lines.length - diffLine - 1));
				return;
				// If many lines have changed, rerender everything past the first line
			} else if (diff && diff?.length > 1) {
				const diffLine = diff[0];
				this.output.write(cursor.move(0, diffLine));
				this.output.write(erase.down());
				const lines = frame.split('\n');
				const newLines = lines.slice(diffLine);
				this.output.write(newLines.join('\n'));
				this._prevFrame = frame;
				return;
			}

			this.output.write(erase.down());
		}

		this.output.write(frame);
		if (this.state === 'initial') {
			this.state = 'active';
		}
		this._prevFrame = frame;
	}
}
