import color from 'picocolors';
import { exposeTestUtils } from '../utils';
import Prompt, { PromptOptions } from './prompt';

export interface TextOptions extends PromptOptions<TextPrompt> {
	placeholder?: string;
	defaultValue?: string;
}

export default class TextPrompt extends Prompt {
	public valueWithCursor: string;

	get cursor() {
		return this._cursor;
	}

	constructor(opts: TextOptions) {
		super(opts, true);

		this.value = opts.initialValue ?? '';
		this.valueWithCursor = this.value + color.inverse(color.hidden('_'));

		this.exposeTestUtils();

		this.on('finalize', () => {
			if (!this.value && opts.defaultValue) {
				this.value = opts.defaultValue;
			}
			this.valueWithCursor = this.value;
			this.exposeTestUtils();
		});

		this.on('value', (value) => {
			this.value = value;
			if (this.cursor >= this.value.length) {
				this.valueWithCursor = `${this.value}${color.inverse(color.hidden('_'))}`;
			} else {
				const s1 = this.value.slice(0, this.cursor);
				const s2 = this.value.slice(this.cursor);
				this.valueWithCursor = `${s1}${color.inverse(s2[0])}${s2.slice(1)}`;
			}
			this.exposeTestUtils();
		});
	}

	private exposeTestUtils() {
		exposeTestUtils<TextPrompt>({
			value: this.value,
			valueWithCursor: this.valueWithCursor,
			cursor: this.cursor,
		});
	}
}
