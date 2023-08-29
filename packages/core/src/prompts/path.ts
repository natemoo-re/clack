import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import color from 'picocolors';
import Prompt, { PromptOptions } from './prompt';

interface PathNode {
	name: string;
	children: PathNode[] | undefined;
}

type PathType = 'text' | 'select';

type PathOptions = PromptOptions<PathPrompt> &
	(
		| {
				type: 'text';
				onlyShowDir?: boolean;
				placeholder?: string;
		  }
		| {
				type: 'select';
				onlyShowDir?: boolean;
		  }
	);

export default class PathPrompt extends Prompt {
	public readonly type: PathType;
	public readonly placeholder: string;
	public readonly onlyShowDir: boolean;
	public root: PathNode;
	public hint: string;
	public valueWithHint: string;

	private _cursorMap: number[];

	public get option() {
		let aux: PathNode = this.root;
		for (const index of this._cursorMap) {
			if (aux.children && aux.children[index]) {
				aux = aux.children[index];
			}
		}
		return {
			index: this._cursorMap[this._cursorMap.length - 1] ?? 0,
			depth: this._cursorMap.length,
			node: aux,
		};
	}

	public get options(): PathNode[] {
		let aux: PathNode = this.root;
		let options: PathNode[] = [this.root];
		for (const index of this._cursorMap) {
			options = options.concat(aux.children ?? []);
			if (aux.children && aux.children[index]) {
				aux = aux.children[index];
			}
		}
		return options;
	}

	public get cursor(): number {
		return this.type === 'select' ? this._cursorMap.reduce((a, b) => a + b + 1, 0) : this._cursor;
	}

	private get _layer(): PathNode[] {
		let aux: PathNode = this.root;
		let options: PathNode[] = [];
		for (const index of this._cursorMap) {
			if (aux.children?.[index]) {
				options = aux.children;
				aux = aux.children[index];
			} else {
				break;
			}
		}
		return options;
	}

	private get _selectValue(): string {
		const value: string[] = [];
		let option: PathNode = this.root;
		for (const index of this._cursorMap) {
			if (option.children?.[index]) {
				option = option.children[index];
				value.push(option.name);
			}
		}
		return resolve(this.root.name, ...value);
	}

	private _changeSelectValue(): void {
		this.value = this._selectValue;
	}

	private _changeHint(): void {
		const root = resolve(this.value.replace(/^(.*\/).*/, '$1'));
		const pathEnd = this.value.replace(/.*\/(.*)$/, '$1');

		let options: string[] = [];
		if (statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
			options = this.mapDir(root).map((node) => node.name);
		}
		const option = options.find((opt) => opt.startsWith(pathEnd)) ?? '';

		this.hint = option.replace(pathEnd, '');
	}

	private _changeInputValue(): void {
		this._changeHint();
		if (this.cursor >= this.value.length) {
			this.valueWithHint = `${this.value}${color.inverse(this.hint.charAt(0))}${color.dim(
				this.hint.slice(1)
			)}`;
		} else {
			const s1 = this.value.slice(0, this.cursor);
			const s2 = this.value.slice(this.cursor);
			this.valueWithHint = `${s1}${color.inverse(s2[0])}${s2.slice(1)}${color.dim(this.hint)}`;
		}
		if (!this.hint) {
			this.valueWithHint += color.inverse(color.hidden('_'));
		}
	}

	private _changeValue(): void {
		this.type === 'select' ? this._changeSelectValue() : this._changeInputValue();
	}

	private _autocomplete(): void {
		const complete = this.value ? this.hint : this.placeholder;
		this.value += complete;
		this._cursor = this.value.length;
		this.rl.write(complete);
		this._changeInputValue();
	}

	private mapDir(path: string): PathNode[] {
		return readdirSync(path, { withFileTypes: true })
			.map((item) => ({
				name: item.name,
				children: item.isDirectory() ? [] : undefined,
			}))
			.filter((node) => {
				return this.onlyShowDir ? !!node.children : true;
			});
	}

	constructor(opts: PathOptions) {
		super(opts, opts.type === 'text');

		// General
		this.type = opts.type;
		this.onlyShowDir = opts.onlyShowDir ?? false;
		this.value = opts.initialValue ?? '';

		// Select
		this._cursorMap = [0];
		const cwd = opts.initialValue ?? process.cwd();
		this.root = {
			name: cwd,
			children: this.mapDir(cwd),
		};

		// Text
		this.placeholder = opts.placeholder ?? '';
		this.hint = '';
		this.valueWithHint = '';

		this._changeValue();

		this.on('cursor', (key) => {
			if (this.type !== 'select') return;

			switch (key) {
				case 'up':
					if (this._cursorMap.length) {
						this._cursorMap = [
							...this._cursorMap.slice(0, -1),
							this.option.index > 0 ? this.option.index - 1 : this._layer.length - 1,
						];
					}
					break;
				case 'down':
					if (this._cursorMap.length) {
						this._cursorMap = [
							...this._cursorMap.slice(0, -1),
							this.option.index < this._layer.length - 1 ? this.option.index + 1 : 0,
						];
					}
					break;
				case 'right':
					if (this.option.node.children) {
						const children = this.mapDir(this._selectValue);
						this.option.node.children = children;
						this._cursorMap = children.length ? [...this._cursorMap, 0] : this._cursorMap;
					}
					break;
				case 'left':
					const prevCursor = this._cursorMap;
					this._cursorMap = this._cursorMap.slice(0, -1);
					if (this.option.node.children?.length && this._cursorMap.length) {
						this.option.node.children = [];
					} else if (prevCursor.length === 0) {
						const cwd = resolve(this.root.name, '..');
						this.root = {
							name: cwd,
							children: this.mapDir(cwd),
						};
					}
					break;
			}
			return this._changeSelectValue();
		});

		this.on('cursor', (key) => {
			if (this.type !== 'text') return;

			if (key === 'right' && this.cursor >= this.value.length) {
				this._autocomplete();
			}
		});

		this.on('key', (key) => {
			if (this.type !== 'text') return;

			if (key === '\t') {
				this._autocomplete();
			}
		});

		this.on('value', () => {
			if (this.type !== 'text') return;
			this._changeInputValue();
		});

		this.on('finalize', () => {
			this.value = this.value ? resolve(this.value) : '';
		});
	}
}
