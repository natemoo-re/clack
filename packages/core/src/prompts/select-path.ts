import { readdirSync } from 'node:fs';
import path from 'node:path';
import Prompt, { PromptOptions } from './prompt';

interface PathNode {
	index: number;
	depth: number;
	path: string;
	name: string;
	parent: PathNode | undefined;
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

	public get cursor(): number {
		return this.options.indexOf(this.currentOption);
	}

	private _changeCursor(index: number): void {
		const firstIndex = 0;
		const lastIndex = this.currentLayer.length - 1;
		const nextIndex = index > lastIndex ? firstIndex : index < firstIndex ? lastIndex : index;
		this.currentOption = this.currentLayer[nextIndex];
	}

	private _search(value: string): void {
		const search = value.normalize('NFC').toLowerCase();
		if (search) {
			const foundOption = this.currentLayer.find((option) =>
				option.name.normalize('NFC').toLowerCase().startsWith(search)
			);
			if (foundOption) {
				this._changeCursor(foundOption.index);
			}
		}
	}

	private _enterChildren(): void {
		const children =
			this.currentOption.children && this._mapDir(this.currentOption.path, this.currentOption);
		this.currentOption.children = children;
		if (children?.length) {
			this.currentLayer = children;
			this.currentOption = children[0];
		}
	}

	private _exitChildren(): void {
		if (this.currentOption.parent === undefined) {
			const newRootPath = path.resolve(this.currentOption.path, '..');
			this.root = this._createRoot(newRootPath);
			this.currentLayer = [this.root];
			this.currentOption = this.root;
		} else if (this.currentOption.parent.path === this.root.path) {
			this.currentLayer = [this.root];
			this.currentOption = this.root;
		} else {
			const prevChildren = this.currentOption.parent.parent?.children ?? [];
			this.currentLayer = prevChildren;
			this.currentOption =
				prevChildren.find((child) => child.name === this.currentOption.parent?.name) ??
				prevChildren[0];
			this.currentOption.children = this.currentOption.children && [];
		}
	}

	private _mapDir(dirPath: string, parent?: PathNode): PathNode[] {
		return readdirSync(dirPath, { withFileTypes: true })
			.map(
				(item, index) =>
					({
						index,
						depth: parent ? parent.depth + 1 : 0,
						parent,
						path: path.resolve(dirPath, item.name),
						name: item.name,
						children: item.isDirectory() ? [] : undefined,
					}) satisfies PathNode
			)
			.filter((node) => {
				return this.onlyShowDir ? !!node.children : true;
			});
	}

	private _createRoot(path: string): PathNode {
		const root: PathNode = {
			index: 0,
			depth: 0,
			parent: undefined,
			path: path,
			name: path,
			children: [],
		};
		root.children = this._mapDir(path, root);
		return root;
	}

	constructor(opts: SelectPathOptions) {
		super(opts, true);

		const cwd = opts.initialValue ?? process.cwd();
		this.root = this._createRoot(cwd);
		const initialLayer = this.root.children!;
		this.currentLayer = initialLayer;
		this.currentOption = initialLayer[0];
		this.onlyShowDir = opts.onlyShowDir ?? false;

		this.on('key', () => {
			this.value = this.value.replace(opts.initialValue, '');
			this._search(this.value);
		});

		this.on('cursor', (key) => {
			switch (key) {
				case 'up':
					if (this.currentLayer.length > 1) {
						this._changeCursor(this.currentOption.index - 1);
					}
					break;
				case 'down':
					if (this.currentLayer.length > 1) {
						this._changeCursor(this.currentOption.index + 1);
					}
					break;
				case 'left':
					this._exitChildren();
					break;
				case 'right':
					this._enterChildren();
					break;
			}
		});

		this.on('finalize', () => {
			this.value = this.currentOption.path;
		});
	}
}
