import Prompt, { PromptOptions } from './prompt';

interface GroupMultiSelectOptions<T extends { value: any }>
	extends PromptOptions<GroupMultiSelectPrompt<T>> {
	options: Record<string, T[]>;
	initialValues?: T['value'][];
	required?: boolean;
	cursorAt?: T['value'];
	selectableGroups?: boolean;
}
export default class GroupMultiSelectPrompt<T extends { value: any }> extends Prompt {
	options: (T & { group: string | boolean })[];
	cursor: number = 0;
	#selectableGroups: boolean;

	getGroupItems(group: string): T[] {
		return this.options.filter((o) => o.group === group);
	}

	isGroupSelected(group: string) {
		const items = this.getGroupItems(group);
		return this.#selectableGroups && items.every((i) => this.value.includes(i.value));
	}

	private toggleValue() {
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
		this.#selectableGroups = opts.selectableGroups ?? true;
		this.options = Object.entries(options).flatMap(([key, option]) => [
			{ value: key, group: true, label: key },
			...option.map((opt) => ({ ...opt, group: key })),
		]) as any;
		this.value = [...(opts.initialValues ?? [])];
		this.cursor = Math.max(
			this.options.findIndex(({ value }) => value === opts.cursorAt),
			this.#selectableGroups ? 0 : 1
		);

		this.on('cursor', (key) => {
			switch (key) {
				case 'left':
				case 'up':
					this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
					if (!this.#selectableGroups && this.options[this.cursor].group === true) {
						this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
					}
					break;
				case 'down':
				case 'right':
					this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
					if (!this.#selectableGroups && this.options[this.cursor].group === true) {
						this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
					}
					break;
				case 'space':
					this.toggleValue();
					break;
			}
		});
	}
}
