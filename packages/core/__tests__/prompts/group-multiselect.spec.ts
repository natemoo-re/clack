import { GroupMultiSelectPrompt, mockPrompt, setGlobalAliases } from '../../src';
import { GroupMultiSelectOptions } from '../../src/prompts/group-multiselect';

const makeSut = (opts?: Partial<GroupMultiSelectOptions<{ value: string }>>) => {
	return new GroupMultiSelectPrompt<any>({
		render() {
			return this.value;
		},
		options: {
			'changed packages': [{ value: '@scope/a' }, { value: '@scope/b' }, { value: '@scope/c' }],
			'unchanged packages': [{ value: '@scope/x' }, { value: '@scope/y' }, { value: '@scope/z' }],
		},
		...opts,
	}).prompt();
};

describe('GroupMultiSelectPrompt', () => {
	const mock = mockPrompt<GroupMultiSelectPrompt<{ value: string }>>();

	afterEach(() => {
		mock.close();
	});

	it('should set options', () => {
		makeSut();

		expect(mock.options).toStrictEqual([
			{ label: 'changed packages', value: 'changed packages', group: true },
			{ value: '@scope/a', group: 'changed packages' },
			{ value: '@scope/b', group: 'changed packages' },
			{ value: '@scope/c', group: 'changed packages' },
			{ label: 'unchanged packages', value: 'unchanged packages', group: true },
			{ value: '@scope/x', group: 'unchanged packages' },
			{ value: '@scope/y', group: 'unchanged packages' },
			{ value: '@scope/z', group: 'unchanged packages' },
		]);
	});

	it('should set initialValues', () => {
		makeSut({
			initialValues: ['@scope/a', 'unchanged packages'],
		});

		expect(mock.value).toStrictEqual(['@scope/a', '@scope/x', '@scope/y', '@scope/z']);
	});

	it('should set initial cursor position', () => {
		makeSut({
			cursorAt: '@scope/b',
		});

		expect(mock.cursor).toBe(2);
	});

	it('should set default cursor position', () => {
		makeSut();

		expect(mock.cursor).toBe(0);
	});

	it('should change cursor position on cursor', () => {
		makeSut({
			options: {
				groupA: [{ value: '1' }],
				groupB: [{ value: '1' }],
			},
		});
		const moves = [
			['down', 1],
			['right', 2],
			['down', 3],
			['right', 0],
			['left', 3],
			['up', 2],
		] as const;

		for (const [cursor, index] of moves) {
			mock.emit('cursor', cursor);
			expect(mock.cursor).toBe(index);
		}
	});

	it('should change cursor position on cursor alias', () => {
		setGlobalAliases([
			['d', 'down'],
			['u', 'up'],
		]);
		makeSut();
		const moves = [
			['d', 1],
			['u', 0],
		] as const;

		for (const [cursor, index] of moves) {
			mock.pressKey(cursor, { name: cursor });
			expect(mock.cursor).toBe(index);
		}
	});

	it('should toggle option', () => {
		makeSut();

		mock.emit('cursor', 'down');
		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual(['@scope/a']);
	});

	it('should toggle multiple options', () => {
		makeSut();

		mock.emit('cursor', 'down');
		mock.emit('cursor', 'space');
		mock.emit('cursor', 'down');
		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual(['@scope/a', '@scope/b']);
	});

	it('should untoggle option', () => {
		makeSut();

		mock.emit('cursor', 'down');
		mock.emit('cursor', 'space');
		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual([]);
	});

	it('should toggle group', () => {
		makeSut();

		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual(['@scope/a', '@scope/b', '@scope/c']);
	});

	it('should toggle multiple groups', () => {
		makeSut();

		mock.emit('cursor', 'space');
		mock.emit('cursor', 'down');
		mock.emit('cursor', 'down');
		mock.emit('cursor', 'down');
		mock.emit('cursor', 'down');
		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual([
			'@scope/a',
			'@scope/b',
			'@scope/c',
			'@scope/x',
			'@scope/y',
			'@scope/z',
		]);
	});

	it('should untoggle group', () => {
		makeSut();

		mock.emit('cursor', 'space');
		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual([]);
	});

	it('should submit value', () => {
		makeSut({
			initialValues: ['changed packages'],
		});

		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.value).toStrictEqual(['@scope/a', '@scope/b', '@scope/c']);
	});
});
