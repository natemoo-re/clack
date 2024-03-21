import { exposeTestUtils } from '../utils';
import Prompt, { PromptOptions } from './prompt';

export interface SelectKeyOptions<T extends { value: any }>
	extends PromptOptions<SelectKeyPrompt<T>> {
	options: T[];
}

export default class SelectKeyPrompt<T extends { value: any }> extends Prompt {
	public options: T[];
	public cursor: number;

	constructor(opts: SelectKeyOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		const keys = this.options.map(({ value: [initial] }) => initial?.toLowerCase());
		this.cursor = Math.max(keys.indexOf(opts.initialValue), 0);
		this.value = this.options[this.cursor].value;

		this.exposeTestUtils();

		this.on('key', (key) => {
			if (!keys.includes(key)) return;
			const value = this.options.find(({ value: [initial] }) => initial?.toLowerCase() === key);
			if (value) {
				this.value = value.value;
				this.state = 'submit';
				this.close();
			}
			this.exposeTestUtils();
		});
	}

	private exposeTestUtils() {
		exposeTestUtils<SelectKeyPrompt<any>>({
			state: this.state,
			options: this.options,
			cursor: this.cursor,
			value: this.value,
		});
	}
}
