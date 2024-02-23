import { randomUUID } from 'crypto';
import color from 'picocolors';
import { mockPrompt, TextPrompt } from '../../src';
import { TextOptions } from '../../src/prompts/text';
import { cursor } from '../utils';

const makeSut = (opts?: Partial<TextOptions>) => {
	return new TextPrompt({
		render() {
			return this.value;
		},
		...opts,
	}).prompt();
};

describe('TextPrompt', () => {
	const mock = mockPrompt<TextPrompt>();

	afterEach(() => {
		mock.close();
	});

	it('should set initialValue', () => {
		const value = randomUUID();

		makeSut({
			initialValue: value,
		});

		expect(mock.value).toBe(value);
	});

	it('should change cursor position when cursor changes', () => {
		const value = randomUUID();
		let cursorIndex = value.length;

		makeSut({
			initialValue: value,
		});

		expect(mock.valueWithCursor).toBe(value + cursor);

		cursorIndex--;
		mock.setCursor(cursorIndex);
		mock.emit('value', value);
		expect(mock.valueWithCursor).toBe(
			value.slice(0, cursorIndex) + color.inverse(value[cursorIndex]) + value.slice(cursorIndex + 1)
		);

		cursorIndex--;
		mock.setCursor(cursorIndex);
		mock.emit('value', value);
		expect(mock.valueWithCursor).toBe(
			value.slice(0, cursorIndex) + color.inverse(value[cursorIndex]) + value.slice(cursorIndex + 1)
		);

		cursorIndex += 2;
		mock.setCursor(cursorIndex);
		mock.emit('value', value);
		expect(mock.valueWithCursor).toBe(value + cursor);
	});

	it('should submit default value if no value is provided', () => {
		const defaultValue = randomUUID();

		makeSut({
			defaultValue,
			initialValue: '',
		});
		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe(defaultValue);
	});

	it('should submit value', () => {
		const value = randomUUID();

		makeSut();
		mock.submit(value);

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe(value);
	});
});
