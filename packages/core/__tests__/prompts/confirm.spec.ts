import { ConfirmPrompt, mockPrompt, setGlobalAliases } from '../../src';
import { ConfirmOptions } from '../../src/prompts/confirm';

const makeSut = (opts?: Partial<ConfirmOptions>) => {
	return new ConfirmPrompt({
		render() {
			return this.value;
		},
		active: 'yes',
		inactive: 'no',
		...opts,
	}).prompt();
};

describe('ConfirmPrompt', () => {
	const mock = mockPrompt<ConfirmPrompt>();

	afterEach(() => {
		mock.close();
	});

	it('should set a boolean value', () => {
		makeSut({
			// @ts-expect-error
			initialValue: ' ',
		});
		expect(mock.value).toBe(true);
		mock.close();

		makeSut({
			// @ts-expect-error
			initialValue: '',
		});
		expect(mock.state).toBe('initial');
		expect(mock.value).toBe(false);
	});

	it('should change value when cursor changes', () => {
		makeSut();

		expect(mock.value).toBe(false);
		mock.pressKey('up', { name: 'up' });
		expect(mock.cursor).toBe(0);
		expect(mock.value).toBe(true);
		mock.pressKey('right', { name: 'right' });
		expect(mock.cursor).toBe(1);
		expect(mock.value).toBe(false);
		mock.pressKey('left', { name: 'left' });
		expect(mock.cursor).toBe(0);
		expect(mock.value).toBe(true);
	});

	it('should change value on cursor alias', () => {
		setGlobalAliases([['u', 'up']]);
		makeSut();

		expect(mock.value).toBe(false);
		mock.pressKey('u', { name: 'u' });
		expect(mock.value).toBe(true);
	});

	it('should not change value on type', () => {
		makeSut();

		expect(mock.value).toBe(false);
		mock.pressKey('t', { name: 't' });
		expect(mock.value).toBe(false);
		mock.pressKey('e', { name: 'e' });
		expect(mock.value).toBe(false);
	});

	it('should submit value', () => {
		makeSut();

		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe(false);
	});

	it('should submit value on confirm alias', () => {
		const aliases = [
			['y', true],
			['n', false],
		] as const;

		for (const [alias, expected] of aliases) {
			makeSut();
			expect(mock.state).not.toBe('submit');
			mock.pressKey(alias, { name: alias });
			expect(mock.state).toBe('submit');
			expect(mock.value).toBe(expected);
			mock.close();
		}
	});
});
