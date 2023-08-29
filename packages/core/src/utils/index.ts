import { stdin, stdout } from 'node:process';
import type { Key } from 'node:readline';
import * as readline from 'node:readline';
import { Readable } from 'node:stream';
import { cursor } from 'sisteransi';
import { hasAliasKey } from './aliases';

export * from './aliases';
export * from './string';

export const CANCEL_SYMBOL = Symbol('clack:cancel');

export function isCancel(value: unknown): value is symbol {
	return value === CANCEL_SYMBOL;
}

export function setRawMode(input: Readable, value: boolean) {
	const i = input as typeof stdin;

	if (i.isTTY) i.setRawMode(value);
}

export function block({
	input = stdin,
	output = stdout,
	overwrite = true,
	hideCursor = true,
} = {}) {
	const rl = readline.createInterface({
		input,
		output,
		prompt: '',
		tabSize: 1,
	});
	readline.emitKeypressEvents(input, rl);
	if (input.isTTY) input.setRawMode(true);

	const clear = (data: Buffer, { name, sequence }: Key) => {
		const str = String(data);
		if (hasAliasKey([str, name, sequence], 'cancel')) {
			process.exit(0);
		}
		if (!overwrite) return;
		let dx = name === 'return' ? 0 : -1;
		let dy = name === 'return' ? -1 : 0;

		readline.moveCursor(output, dx, dy, () => {
			readline.clearLine(output, 1, () => {
				input.once('keypress', clear);
			});
		});
	};
	if (hideCursor) process.stdout.write(cursor.hide);
	input.once('keypress', clear);

	return () => {
		input.off('keypress', clear);
		if (hideCursor) process.stdout.write(cursor.show);
		if (input.isTTY) input.setRawMode(false);

		// @ts-expect-error fix for https://github.com/nodejs/node/issues/31762#issuecomment-1441223907
		rl.terminal = false;
		rl.close();
	};
}
