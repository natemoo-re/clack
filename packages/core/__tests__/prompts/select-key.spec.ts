import { mockPrompt, SelectKeyPrompt } from '../../src';
import { SelectKeyOptions } from '../../src/prompts/select-key';

const makeSut = (opts?: Partial<SelectKeyOptions<{ value: string }>>) => {
	return new SelectKeyPrompt<{ value: string }>({
		render() {
			return this.value;
		},
		options: [{ value: 'alpha' }, { value: 'bravo' }, { value: 'charle' }],
		...opts,
	}).prompt();
};

describe('SelectKeyPrompt', () => {
	const mock = mockPrompt<SelectKeyPrompt<{ value: string }>>();

	afterEach(() => {
		mock.close();
	});

	it('should set options', () => {
		makeSut();

		expect(mock.options).toStrictEqual([
			{ value: 'alpha' },
			{ value: 'bravo' },
			{ value: 'charle' },
		]);
	});

	it('should set cursor position', () => {
		makeSut({
			initialValue: 'b',
		});

		expect(mock.cursor).toBe(1);
	});

	it('should set default cursor position', () => {
		makeSut();

		expect(mock.cursor).toBe(0);
	});

	it('should not submit value on invalid key', () => {
		makeSut();

		mock.emit('key', 't');

		expect(mock.state).toBe('initial');
	});

	it('should submit value', () => {
		makeSut();

		mock.emit('key', 'a');

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe('alpha');
	});
});
