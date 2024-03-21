import { cursor } from 'sisteransi';
import Prompt, { type PromptOptions } from './prompt';

interface ConfirmOptions extends PromptOptions<ConfirmPrompt> {
	active: string;
	inactive: string;
	initialValue?: boolean;
}
export default class ConfirmPrompt extends Prompt {
	get cursor() {
		return this.value ? 0 : 1;
	}

	private get _value() {
		return this.cursor === 0;
	}

	constructor(opts: ConfirmOptions) {
		super(opts, false);
		this.value = opts.initialValue ? true : false;

		this.on('value', () => {
			this.value = this._value;
		});

		this.on('confirm', (confirm) => {
			this.output.write(cursor.move(0, -1));
			this.value = confirm;
			this.state = 'submit';
			this.close();
		});

		this.on('cursor', () => {
			this.value = !this.value;
		});
	}
}
