import Prompt, { type PromptOptions } from './prompt';

interface SelectKeyOptions<T extends { value: any }> extends PromptOptions<SelectKeyPrompt<T>> {
	options: T[];
}
export default class SelectKeyPrompt<T extends { value: any }> extends Prompt {
	options: T[];
	cursor: number = 0;

	constructor(opts: SelectKeyOptions<T>) {
		super(opts, false);

		this.options = opts.options;
		const keys = this.options.map(({ value: [initial] }) => initial?.toLowerCase());
		this.cursor = Math.max(keys.indexOf(opts.initialValue), 0);

		this.on('key', (key) => {
			if (!keys.includes(key)) return;
			const value = this.options.find(({ value: [initial] }) => initial?.toLowerCase() === key);
			if (value) {
				this.value = value.value;
				this.state = 'submit';
				this.emit('submit');
			}
		});
	}
}
