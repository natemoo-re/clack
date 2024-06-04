import { describe, expect, test, afterEach, beforeEach, vi } from 'vitest';
import { default as Prompt, isCancel } from '../../src/prompts/prompt.js';
import { cursor } from 'sisteransi';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('Prompt', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders render() result', () => {
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});
		// leave the promise hanging since we don't want to submit in this test
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	test('submits on return key', async () => {
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});
		const resultPromise = instance.prompt();
		input.emit('keypress', '', { name: 'return' });
		const result = await resultPromise;
		expect(result).to.equal('');
		expect(isCancel(result)).to.equal(false);
		expect(instance.state).to.equal('submit');
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo', '\n', cursor.show]);
	});

	test('cancels on ctrl-c', async () => {
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});
		const resultPromise = instance.prompt();
		input.emit('keypress', '\x03', { name: 'c' });
		const result = await resultPromise;
		expect(isCancel(result)).to.equal(true);
		expect(instance.state).to.equal('cancel');
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo', '\n', cursor.show]);
	});

	test('writes initialValue to value', () => {
		const eventSpy = vi.fn();
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
			initialValue: 'bananas',
		});
		instance.on('value', eventSpy);
		instance.prompt();
		expect(instance.value).to.equal('bananas');
		expect(eventSpy).toHaveBeenCalled();
	});

	test('re-renders on resize', () => {
		const renderFn = vi.fn().mockImplementation(() => 'foo');
		const instance = new Prompt({
			input,
			output,
			render: renderFn,
		});
		instance.prompt();

		expect(renderFn).toHaveBeenCalledTimes(1);

		output.emit('resize');

		expect(renderFn).toHaveBeenCalledTimes(2);
	});

	test('state is active after first render', async () => {
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});

		expect(instance.state).to.equal('initial');

		instance.prompt();

		expect(instance.state).to.equal('active');
	});

	test('emits truthy confirm on y press', () => {
		const eventFn = vi.fn();
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});

		instance.on('confirm', eventFn);

		instance.prompt();

		input.emit('keypress', 'y', { name: 'y' });

		expect(eventFn).toBeCalledWith(true);
	});

	test('emits falsey confirm on n press', () => {
		const eventFn = vi.fn();
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});

		instance.on('confirm', eventFn);

		instance.prompt();

		input.emit('keypress', 'n', { name: 'n' });

		expect(eventFn).toBeCalledWith(false);
	});

	test('sets value as placeholder on tab if one is set', () => {
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
			placeholder: 'piwa',
		});

		instance.prompt();

		input.emit('keypress', '\t', { name: 'tab' });

		expect(instance.value).to.equal('piwa');
	});

	test('does not set placeholder value on tab if value already set', () => {
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
			placeholder: 'piwa',
			initialValue: 'trzy',
		});

		instance.prompt();

		input.emit('keypress', '\t', { name: 'tab' });

		expect(instance.value).to.equal('trzy');
	});

	test('emits key event for unknown chars', () => {
		const eventSpy = vi.fn();
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});

		instance.on('key', eventSpy);

		instance.prompt();

		input.emit('keypress', 'z', { name: 'z' });

		expect(eventSpy).toBeCalledWith('z');
	});

	test('emits cursor events for movement keys', () => {
		const keys = ['up', 'down', 'left', 'right'];
		const eventSpy = vi.fn();
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});

		instance.on('cursor', eventSpy);

		instance.prompt();

		for (const key of keys) {
			input.emit('keypress', key, { name: key });
			expect(eventSpy).toBeCalledWith(key);
		}
	});

	test('emits cursor events for movement key aliases when not tracking', () => {
		const keys = [
			['k', 'up'],
			['j', 'down'],
			['h', 'left'],
			['l', 'right'],
		];
		const eventSpy = vi.fn();
		const instance = new Prompt(
			{
				input,
				output,
				render: () => 'foo',
			},
			false
		);

		instance.on('cursor', eventSpy);

		instance.prompt();

		for (const [alias, key] of keys) {
			input.emit('keypress', alias, { name: alias });
			expect(eventSpy).toBeCalledWith(key);
		}
	});
});
