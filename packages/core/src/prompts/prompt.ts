import { stdin, stdout } from 'node:process';
import readline, { type Key, type ReadLine } from 'node:readline';
import { Readable, Writable } from 'node:stream';
import { WriteStream } from 'node:tty';
import { cursor, erase } from 'sisteransi';
import wrap from 'wrap-ansi';

import {
	ALIASES,
	CANCEL_SYMBOL,
	diffLines,
	exposeTestUtils,
	hasAliasKey,
	isTestMode,
	KEYS,
	setRawMode
} from '../utils';

import type { ClackEvents, ClackState, InferSetType } from '../types';

export interface PromptOptions<Self extends Prompt> {
	render(this: Omit<Self, 'prompt'>): string | void;
	placeholder?: string;
	initialValue?: any;
	validate?: ((value: any) => string | void) | undefined;
	input?: Readable;
	output?: Writable;
	debug?: boolean;
}

export default class Prompt {
	protected input: Readable;
	protected output: Writable;

	private rl!: ReadLine;
	private opts: Omit<PromptOptions<Prompt>, 'render' | 'input' | 'output'>;
	private _render: (context: Omit<Prompt, 'prompt'>) => string | void;
	private _track = false;
	private _prevFrame = '';
	private _subscribers = new Map<string, { cb: (...args: any) => any; once?: boolean }[]>();
	protected _cursor = 0;

	public state: ClackState = 'initial';
	public error = '';
	public value: any;

	constructor(options: PromptOptions<Prompt>, trackValue: boolean = true) {
		const { input = stdin, output = stdout, render, ...opts } = options;

		this.opts = opts;
		this.onKeypress = this.onKeypress.bind(this);
		this.close = this.close.bind(this);
		this.render = this.render.bind(this);
		this._render = render.bind(this);
		this._track = trackValue;

		this.input = input;
		this.output = output;

		exposeTestUtils({
			...this,
			on: this.on.bind(this),
			once: this.once.bind(this),
			emit: this.emit.bind(this),
			pressKey: this.onKeypress.bind(this),
			updateFrame: this.render.bind(this),
			close: this.close.bind(this),
			setState: (state) => {
				this.state = state;
			},
			setCursor: (cursor) => {
				this._cursor = cursor;
			},
			setValue: (value) => {
				this.value = value;
			},
			cancel: (value) => {
				this.value = value ?? this.value;
				this.onKeypress('', { name: '\x03' });
			},
			submit: (value) => {
				this.value = value ?? this.value;
				this.onKeypress('', { name: 'return' });
			},
		});
	}

	/**
	 * Unsubscribe all listeners
	 */
	protected unsubscribe() {
		this._subscribers.clear();
	}

	/**
	 * Set a subscriber with opts
	 * @param event - The event name
	 */
	private setSubscriber<T extends keyof ClackEvents>(
		event: T,
		opts: { cb: ClackEvents[T]; once?: boolean }
	) {
		const params = this._subscribers.get(event) ?? [];
		params.push(opts);
		this._subscribers.set(event, params);
	}

	/**
	 * Subscribe to an event
	 * @param event - The event name
	 * @param cb - The callback
	 */
	public on<T extends keyof ClackEvents>(event: T, cb: ClackEvents[T]) {
		this.setSubscriber(event, { cb });
	}

	/**
	 * Subscribe to an event once
	 * @param event - The event name
	 * @param cb - The callback
	 */
	public once<T extends keyof ClackEvents>(event: T, cb: ClackEvents[T]) {
		this.setSubscriber(event, { cb, once: true });
	}

	/**
	 * Emit an event with data
	 * @param event - The event name
	 * @param data - The data to pass to the callback
	 */
	public emit<T extends keyof ClackEvents>(event: T, ...data: Parameters<ClackEvents[T]>) {
		const cbs = this._subscribers.get(event) ?? [];
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

		exposeTestUtils({ value: this.value });
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
				if (!isTestMode) this.output.write('\n');
				this.output.write(cursor.show);
				resolve(this.value);
			});
			this.once('cancel', () => {
				if (!isTestMode) this.output.write('\n');
				this.output.write(cursor.show);
				resolve(CANCEL_SYMBOL);
			});
		});
	}

	private onKeypress(char: string, key?: Key) {
		if (this.state === 'error') {
			this.state = 'active';
		}
		if (key?.name && !this._track && ALIASES.has(key.name)) {
			this.emit('cursor', ALIASES.get(key.name));
		}
		if (key?.name && KEYS.has(key.name as InferSetType<typeof KEYS>)) {
			this.emit('cursor', key.name as InferSetType<typeof KEYS>);
		}
		if (char && (char.toLowerCase() === 'y' || char.toLowerCase() === 'n')) {
			this.emit('confirm', char.toLowerCase() === 'y');
		}
		if (char === '\t' && this.opts.placeholder) {
			if (!this.value) {
				this.rl.write(this.opts.placeholder);
				this.emit('value', this.opts.placeholder);
			}
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

		if (hasAliasKey([key?.name, key?.sequence], 'cancel')) {
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
		this.output.off('resize', this.render);
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

	private render() {
		const frame = wrap(this._render(this) ?? '', process.stdout.columns, { hard: true });
		exposeTestUtils({ frame, state: this.state, error: this.error });

		if (isTestMode || frame === this._prevFrame) {
			return;
		}

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
