import { describe, expect, test, afterEach, vi } from 'vitest';
import { block } from '../src/utils.js';
import type { Key } from 'node:readline';
import { cursor } from 'sisteransi';
import { MockReadable } from './mock-readable.js';
import { MockWritable } from './mock-writable.js';

describe('utils', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('block', () => {
		test('clears output on keypress', () => {
			const input = new MockReadable();
			const output = new MockWritable();
			const callback = block({ input, output });

			const event: Key = {
				name: 'x',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.move(-1, 0), cursor.show]);
		});

		test('clears output vertically when return pressed', () => {
			const input = new MockReadable();
			const output = new MockWritable();
			const callback = block({ input, output });

			const event: Key = {
				name: 'return',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.move(0, -1), cursor.show]);
		});

		test('ignores additional keypresses after dispose', () => {
			const input = new MockReadable();
			const output = new MockWritable();
			const callback = block({ input, output });

			const event: Key = {
				name: 'x',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			input.emit('keypress', eventData, event);
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.move(-1, 0), cursor.show]);
		});

		test('exits on ctrl-c', () => {
			const input = new MockReadable();
			const output = new MockWritable();
			// purposely don't keep the callback since we would exit the process
			block({ input, output });
			const spy = vi.spyOn(process, 'exit').mockImplementation(() => {
				return;
			});

			const event: Key = {
				name: 'c',
			};
			const eventData = Buffer.from('\x03');
			input.emit('keypress', eventData, event);
			expect(spy).toHaveBeenCalled();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.show]);
		});

		test('does not clear if overwrite=false', () => {
			const input = new MockReadable();
			const output = new MockWritable();
			const callback = block({ input, output, overwrite: false });

			const event: Key = {
				name: 'c',
			};
			const eventData = Buffer.from('bloop');
			input.emit('keypress', eventData, event);
			callback();
			expect(output.buffer).to.deep.equal([cursor.hide, cursor.show]);
		});
	});
});
