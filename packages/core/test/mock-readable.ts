import { Readable } from 'node:stream';

export class MockReadable extends Readable {
	protected _buffer: unknown[] | null = [];

	_read() {
		if (this._buffer === null) {
			this.push(null);
			return;
		}

		for (const val of this._buffer) {
			this.push(val);
		}

		this._buffer = [];
	}

	pushValue(val: unknown): void {
		this._buffer.push(val);
	}

	close(): void {
		this._buffer = null;
	}
}
