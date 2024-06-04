import { Writable } from 'node:stream';

export class MockWritable extends Writable {
	public buffer: string[] = [];

	_write(chunk, encoding, callback) {
		this.buffer.push(chunk.toString());
		callback();
	}
}
