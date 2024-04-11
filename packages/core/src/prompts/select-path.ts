import { readdirSync } from 'node:fs';
import path from 'node:path';
import Prompt, { PromptOptions } from './prompt';

interface PathNode {
	index: number;
	depth: number;
	path: string;
	name: string;
	children: PathNode[] | undefined;
}

export interface SelectPathOptions extends PromptOptions<SelectPathPrompt> {
	onlyShowDir?: boolean;
}

export default class SelectPathPrompt extends Prompt {
	public readonly onlyShowDir: boolean;
	public root: PathNode;
	public currentLayer: PathNode[];
	public currentOption: PathNode;

	private _cursorMap: number[];

	public get cursor(): number {
		return this._cursorMap.reduce((a, b) => a + b + 1, 0);
	}

	public get options(): PathNode[] {
		const options: PathNode[] = [];

		function traverse(node: PathNode) {
			options.push(node);
			const children = node.children ?? [];
			for (const child of children) {
				traverse(child);
			}
		}

		traverse(this.root);

		return options;
	}

	private _changeValue(): void {
		this.value = this.currentOption.path;
	}

	private _changeCursor(index: number): void {
		this._cursorMap[this._cursorMap.length - 1] = index;
		this.currentOption = this.currentLayer[index];
	}

	private _changeLayer(depth: number): void {
		if (depth > this.currentOption.depth) {
			const children =
				this.currentOption.children &&
				this._mapDir(this.currentOption.path, this.currentOption.depth + 1);
			this.currentOption.children = children;
			if (children?.length) {
				this._cursorMap = [...this._cursorMap, 0];
				this.currentLayer = children;
				this.currentOption = children[0];
			}
		} else if (depth < this.currentOption.depth) {
			this._cursorMap = this._cursorMap.slice(0, -1);
			if (this.currentOption.depth === 0) {
				const newRootPath = path.resolve(this.currentOption.path, '..');
				this.root = {
					index: 0,
					depth: 0,
					path: newRootPath,
					name: newRootPath,
					children: this._mapDir(newRootPath, 1),
				};
				this.currentLayer = [this.root];
				this.currentOption = this.root;
			} else if (this.currentOption.depth === 1) {
				this.currentLayer = [this.root];
				this.currentOption = this.root;
			} else {
				const prevChildren = this.options.filter(
					(option) => option.depth === this.currentOption.depth - 1
				);
				this.currentLayer = prevChildren;
				this.currentOption = prevChildren[this._cursorMap[this._cursorMap.length - 1]];
				this.currentOption.children = this.currentOption.children && [];
			}
		}
	}

	private _mapDir(dirPath: string, depth: number): PathNode[] {
		return readdirSync(dirPath, { withFileTypes: true })
			.map(
				(item, index) =>
					({
						index,
						depth,
						path: path.resolve(dirPath, item.name),
						name: item.name,
						children: item.isDirectory() ? [] : undefined,
					}) satisfies PathNode
			)
			.filter((node) => {
				return this.onlyShowDir ? !!node.children : true;
			});
	}

	constructor(opts: SelectPathOptions) {
		super(opts, false);

		const cwd = opts.initialValue ?? process.cwd();
		const initialLayer = this._mapDir(cwd, 1);
		this.root = {
			depth: 0,
			index: 0,
			path: cwd,
			name: cwd,
			children: initialLayer,
		};
		this.currentLayer = initialLayer;
		this.currentOption = initialLayer[0];
		this.onlyShowDir = opts.onlyShowDir ?? false;
		this._cursorMap = [0];

		this._changeValue();

		this.on('cursor', (key) => {
			switch (key) {
				case 'up':
					if (this.currentLayer.length > 1) {
						const firstIndex = 0;
						const currentIndex = this.currentOption.index;
						const lastIndex = this.currentLayer.length - 1;
						const prevIndex = this.currentOption.index - 1;
						this._changeCursor(currentIndex === firstIndex ? lastIndex : prevIndex);
					}
					break;
				case 'down':
					if (this.currentLayer.length > 1) {
						const firstIndex = 0;
						const currentIndex = this.currentOption.index;
						const lastIndex = this.currentLayer.length - 1;
						const nextIndex = this.currentOption.index + 1;
						this._changeCursor(currentIndex === lastIndex ? firstIndex : nextIndex);
					}
					break;
				case 'right':
					this._changeLayer(this.currentOption.depth + 1);
					break;
				case 'left':
					this._changeLayer(this.currentOption.depth - 1);
					break;
			}
			this._changeValue();
		});

		this.on('finalize', () => {
			this.value = this.value ? path.resolve(this.value) : '';
		});
	}
}
