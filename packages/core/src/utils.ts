import type { Key } from 'node:readline';

import { stdin, stdout } from 'node:process';
import * as readline from 'node:readline';
import { cursor } from 'sisteransi';

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

	const clear = (data: Buffer, { name }: Key) => {
		const str = String(data);
		if (str === '\x03') {
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

function ansiRegex(): RegExp {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
	].join('|');

	return new RegExp(pattern, 'g');
}

function stripAnsi(str: string): string {
	return str.replace(ansiRegex(), '');
}

function isControlCharacter(code: number): boolean {
	return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

function isCombiningCharacter(code: number): boolean {
	return code >= 0x300 && code <= 0x36f;
}

function isSurrogatePair(code: number): boolean {
	return code >= 0xd800 && code <= 0xdbff;
}

export function strLength(str: string): number {
	if (str === '') {
		return 0;
	}

	// Remove ANSI escape codes from the input string.
	str = stripAnsi(str);

	let length = 0;

	for (let i = 0; i < str.length; i++) {
		const code = str.codePointAt(i);

		if (!code || isControlCharacter(code) || isCombiningCharacter(code)) {
			continue;
		}

		if (isSurrogatePair(code)) {
			i++; // Skip the next code unit.
		}

		length++;
	}

	return length;
}
