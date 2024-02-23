import { exposeTestUtils } from '../utils';
import Prompt, { PromptOptions } from './prompt';

export interface SelectOptions<T extends { value: any }> extends PromptOptions<SelectPrompt<T>> {
	options: T[];
	initialValue?: T['value'];
}

export default class SelectPrompt<T extends { value: any }> extends Prompt {
	public options: T[];
	public cursor: number;

	private get _value() {
		return this.options[this.cursor];
	}

	private changeValue() {
		this.value = this._value.value;
	}

	constructor(opts: SelectOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		this.cursor = Math.max(
			this.options.findIndex(({ value }) => value === opts.initialValue),
			0
		);
		this.changeValue();

		this.exposeTestUtils();

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
				case 'up':
					this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
					break;
				case 'down':
				case 'right':
					this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
					break;
			}
			this.changeValue();
			this.exposeTestUtils();
		});
	}

	private exposeTestUtils() {
		exposeTestUtils<SelectPrompt<any>>({
			options: this.options,
			cursor: this.cursor,
			value: this.value,
			setCursor: (cursor) => {
				this.cursor = cursor;
				this.exposeTestUtils();
			},
		});
	}
}
