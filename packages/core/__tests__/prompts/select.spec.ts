import { mockPrompt, SelectPrompt, setGlobalAliases } from '../../src';
import { SelectOptions } from '../../src/prompts/select';

const makeSut = (opts?: Partial<SelectOptions<any>>) => {
	return new SelectPrompt({
		render() {
			return this.value;
		},
		options: [{ value: 1 }, { value: 2 }, { value: 3 }],
		...opts,
	}).prompt();
};

describe('SelectPrompt', () => {
	const mock = mockPrompt<SelectPrompt<any>>();

	afterEach(() => {
		mock.close();
	});

	it('should set initialValue', () => {
		makeSut({
			initialValue: 2,
		});

		expect(mock.state).toBe('initial');
		expect(mock.cursor).toBe(1);
		expect(mock.value).toBe(2);
	});

	it('should set first option as default', () => {
		makeSut();

		expect(mock.state).toBe('initial');
		expect(mock.cursor).toBe(0);
		expect(mock.value).toBe(1);
	});

	it('should change cursor position on cursor', () => {
		makeSut();
		mock.setCursor(1);

		expect(mock.cursor).toBe(1);
	});

	it('should change value on emit cursor', () => {
		makeSut();
		const moves = [
			['down', 1, 2],
			['right', 2, 3],
			['right', 0, 1],
			['left', 2, 3],
			['up', 1, 2],
		] as const;

		for (const [cursor, index, value] of moves) {
			mock.emit('cursor', cursor);
			expect(mock.cursor).toBe(index);
			expect(mock.value).toBe(value);
		}
	});

	it('should change value on cursor alias', () => {
		setGlobalAliases([
			['d', 'down'],
			['u', 'up'],
		]);
		makeSut();
		const moves = [
			['d', 1, 2],
			['u', 0, 1],
		] as const;

		for (const [cursor, index, value] of moves) {
			mock.pressKey(cursor, { name: cursor });
			expect(mock.cursor).toBe(index);
			expect(mock.value).toBe(value);
		}
	});

	it('should submit value', () => {
		makeSut();

		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe(1);
	});
});
