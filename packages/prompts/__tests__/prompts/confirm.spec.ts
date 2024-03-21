import { ConfirmPrompt, mockPrompt } from '@clack/core';
import color from 'picocolors';
import { confirm } from '../../src';
import { symbol, S_BAR, S_BAR_END, S_RADIO_ACTIVE, S_RADIO_INACTIVE } from '../../src/utils';

const SLASH = color.dim('/');
const ACTIVE_YES = `${color.green(S_RADIO_ACTIVE)} Yes ${SLASH} ${color.dim(
	S_RADIO_INACTIVE
)} ${color.dim('No')}`;
const ACTIVE_NO = `${color.dim(S_RADIO_INACTIVE)} ${color.dim('Yes')} ${SLASH} ${color.green(
	S_RADIO_ACTIVE
)} No`;

describe('confirm', () => {
	const mock = mockPrompt<ConfirmPrompt>();
	const message = 'test message';

	afterEach(() => {
		mock.close();
	});

	it('should render initial state', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		confirm({ message });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(
			`${title}${color.cyan(S_BAR)}  ${ACTIVE_YES}\n${color.cyan(S_BAR_END)}\n`
		);
	});

	it('should render initial state with custom `active` and `inactive`', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		confirm({ message, active: 'active', inactive: 'inactive' });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(
			`${title}${color.cyan(S_BAR)}  ${color.green(S_RADIO_ACTIVE)} active ${SLASH} ${color.dim(
				S_RADIO_INACTIVE
			)} ${color.dim('inactive')}\n${color.cyan(S_BAR_END)}\n`
		);
	});

	it('should render initial state with initialValue', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('initial')}  ${message}\n`;

		confirm({ message, initialValue: false });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toBe(
			`${title}${color.cyan(S_BAR)}  ${ACTIVE_NO}\n${color.cyan(S_BAR_END)}\n`
		);
	});

	it('should submit value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		confirm({ message });
		mock.submit(true);

		expect(mock.state).toBe('submit');
		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}  ${color.dim('Yes')}`);
	});

	it('should render cancel', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		confirm({ message });
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim('No'))}\n${color.gray(S_BAR)}`
		);
	});

	it('should render cancel with value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		confirm({ message });
		mock.cancel(false);

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${color.strikethrough(color.dim('Yes'))}\n${color.gray(S_BAR)}`
		);
	});

	it('should return value on submit', async () => {
		const promise = confirm({ message });
		mock.submit(true);
		const result = await promise;

		expect(result).toBe(true);
	});
});
