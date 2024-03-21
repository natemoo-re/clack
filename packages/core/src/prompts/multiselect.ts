import { exposeTestUtils } from '../utils';
import Prompt, { PromptOptions } from './prompt';

export interface MultiSelectOptions<T extends { value: any }>
	extends PromptOptions<MultiSelectPrompt<T>> {
	options: T[];
	initialValues?: T['value'][];
	required?: boolean;
	cursorAt?: T['value'];
}

export default class MultiSelectPrompt<T extends { value: any }> extends Prompt {
	public options: T[];
	public cursor: number;

	private get _value() {
		return this.options[this.cursor].value;
	}

	private toggleAll() {
		const allSelected = this.value.length === this.options.length;
		this.value = allSelected ? [] : this.options.map((v) => v.value);
	}

	private toggleValue() {
		const selected = this.value.includes(this._value);
		this.value = selected
			? this.value.filter((value: T['value']) => value !== this._value)
			: [...this.value, this._value];
	}

	constructor(opts: MultiSelectOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		this.value = opts.initialValues ?? [];
		this.cursor = Math.max(
			this.options.findIndex(({ value }) => value === opts.cursorAt),
			0
		);

		this.exposeTestUtils();

		this.on('key', (char) => {
			if (char === 'a') {
				this.toggleAll();
				this.exposeTestUtils();
			}
		});

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
				case 'space':
					this.toggleValue();
					break;
			}
			this.exposeTestUtils();
		});
	}

	private exposeTestUtils() {
		exposeTestUtils<MultiSelectPrompt<any>>({
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
