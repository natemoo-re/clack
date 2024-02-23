import { exposeTestUtils } from '../utils';
import Prompt, { PromptOptions } from './prompt';

export interface GroupMultiSelectOptions<T extends { value: any }>
	extends PromptOptions<GroupMultiSelectPrompt<T>> {
	options: Record<string, T[]>;
	initialValues?: T['value'][];
	required?: boolean;
	cursorAt?: T['value'];
}

export default class GroupMultiSelectPrompt<T extends { value: any }> extends Prompt {
	public options: (T & { group: string | boolean })[];
	public cursor: number;

	getGroupItems(group: string): T[] {
		return this.options.filter((o) => o.group === group);
	}

	isGroupSelected(group: string): boolean {
		const items = this.getGroupItems(group);
		return items.every((i) => this.value.includes(i.value));
	}

	private toggleValue(): void {
		const item = this.options[this.cursor];
		if (item.group === true) {
			const group = item.value;
			const groupedItems = this.getGroupItems(group);
			if (this.isGroupSelected(group)) {
				this.value = this.value.filter(
					(v: string) => groupedItems.findIndex((i) => i.value === v) === -1
				);
			} else {
				this.value = [...this.value, ...groupedItems.map((i) => i.value)];
			}
			this.value = Array.from(new Set(this.value));
		} else {
			const selected = this.value.includes(item.value);
			this.value = selected
				? this.value.filter((v: T['value']) => v !== item.value)
				: [...this.value, item.value];
		}
	}

	constructor(opts: GroupMultiSelectOptions<T>) {
		super(opts, false);

		const { options } = opts;
		this.options = Object.entries(options).flatMap(([key, option]) => [
			{ value: key, group: true, label: key },
			...option.map((opt) => ({ ...opt, group: key })),
		]) as any;

		this.value = [];
		if (opts.initialValues) {
			for (const value of opts.initialValues) {
				const optionIndex = this.options.findIndex((o) => o.value === value);
				if (optionIndex !== -1) {
					this.cursor = optionIndex;
					this.toggleValue();
				}
			}
		}

		this.cursor = Math.max(
			this.options.findIndex(({ value }) => value === opts.cursorAt),
			0
		);

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
				case 'space':
					this.toggleValue();
					break;
			}
			this.exposeTestUtils();
		});
	}

	private exposeTestUtils() {
		exposeTestUtils<GroupMultiSelectPrompt<any>>({
			options: this.options,
			cursor: this.cursor,
			value: this.value,
			isGroupSelected: this.isGroupSelected.bind(this),
			getGroupItems: this.getGroupItems.bind(this),
			setCursor: (cursor: number) => {
				this.cursor = cursor;
				this.exposeTestUtils();
			},
		});
	}
}
