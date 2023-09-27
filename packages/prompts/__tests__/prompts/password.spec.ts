import { mockPrompt, PasswordPrompt } from '@clack/core';
import { randomUUID } from 'node:crypto';
import color from 'picocolors';
import { password } from '../../src';
import { symbol, S_BAR, S_BAR_END } from '../../src/utils';

describe('password', () => {
	const mock = mockPrompt<PasswordPrompt>();
	const message = 'test message';

	afterEach(() => {
		mock.close();
	});

	it('should render initial state', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		password({ message });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(
			`${title}${color.cyan(S_BAR)}  ${mock.valueWithCursor}\n${color.cyan(S_BAR_END)}\n`
		);
	});

	it('should render error', () => {
		const value = randomUUID();
		const title = `${color.gray(S_BAR)}\n${symbol('error')}  ${message}\n`;
		const error = 'invalid value';

		password({
			message,
			validate: (value) => {
				return error;
			},
		});
		mock.submit(value);

		expect(mock.state).toBe('error');
		expect(mock.frame).toBe(
			`${title}${color.yellow(S_BAR)}  ${mock.valueWithCursor}\n${color.yellow(
				S_BAR_END
			)}  ${color.yellow(error)}\n`
		);
	});

	it('should submit value', () => {
		const value = randomUUID();
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		password({ message });
		mock.submit(value);

		expect(mock.state).toBe('submit');
		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}  ${color.dim(mock.masked)}`);
	});

	it('should render cancel', () => {
		const value = randomUUID();
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		password({ message });
		mock.cancel(value);

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim(mock.masked))}\n${color.gray(
				S_BAR
			)}`
		);
	});

	it('should render cancel without value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		password({ message });
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}`);
	});

	it('should return value on submit', async () => {
		const value = randomUUID();

		const promise = password({ message });
		mock.submit(value);
		const result = await promise;

		expect(result).toBe(value);
	});
});
