import { mockPrompt, MultiSelectPrompt, setGlobalAliases } from '../../src';
import { MultiSelectOptions } from '../../src/prompts/multiselect';

const makeSut = (opts?: Partial<MultiSelectOptions<any>>) => {
	return new MultiSelectPrompt({
		render() {
			return this.value;
		},
		options: [{ value: 1 }, { value: 2 }, { value: 3 }],
		...opts,
	}).prompt();
};

describe('MultiSelectPrompt', () => {
	const mock = mockPrompt<MultiSelectPrompt<any>>();

	afterEach(() => {
		mock.close();
	});

	it('should set initialValues', () => {
		makeSut({
			cursorAt: 2,
			initialValues: [1, 2],
		});

		expect(mock.state).toBe('initial');
		expect(mock.cursor).toBe(1);
		expect(mock.value).toStrictEqual([1, 2]);
	});

	it('should set first option as default', () => {
		makeSut();

		expect(mock.state).toBe('initial');
		expect(mock.cursor).toBe(0);
		expect(mock.value).toStrictEqual([]);
	});

	it('should change cursor position on cursor', () => {
		makeSut();
		mock.setCursor(1);

		expect(mock.cursor).toBe(1);
	});

	it('should change cursor position on emit cursor', () => {
		makeSut();
		const moves = [
			['down', 1],
			['right', 2],
			['right', 0],
			['left', 2],
			['up', 1],
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

		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual([1]);
	});

	it('should untoggle option', () => {
		makeSut();

		mock.emit('cursor', 'space');
		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual([]);
	});

	it('should toggle multiple options', () => {
		makeSut();

		mock.emit('cursor', 'space');
		mock.emit('cursor', 'down');
		mock.emit('cursor', 'space');

		expect(mock.value).toStrictEqual([1, 2]);
	});

	it('should toggle all options', () => {
		makeSut();

		mock.emit('key', 'a');

		expect(mock.value).toStrictEqual([1, 2, 3]);
	});

	it('should untoggle all options', () => {
		makeSut();

		mock.emit('key', 'a');
		mock.emit('key', 'a');

		expect(mock.value).toStrictEqual([]);
	});

	it('should submit value', () => {
		makeSut({
			initialValues: [1, 2],
		});

		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.value).toStrictEqual([1, 2]);
	});
});
