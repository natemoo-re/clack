import { mockPrompt, SelectPrompt } from '@clack/core';
import color from 'picocolors';
import { selectKey } from '../../src';
import { opt } from '../../src/prompts/select-key';
import { Option, symbol, S_BAR } from '../../src/utils';

const options: Option<string>[] = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];

describe('selectKey', () => {
	const mock = mockPrompt<SelectPrompt<{ value: string }>>();
	const message = 'test message';

	afterEach(() => {
		mock.close();
	});

	it('should format option state', () => {
		const option: Option<string> = {
			label: 'Foo',
			value: 'foo',
			hint: 'bar',
		};
		const hint = option.hint;

		selectKey({ message, options });

		expect(opt(option, 'selected')).toBe(`${color.dim(option.label)}`);
		expect(opt(option, 'active')).toBe(
			`${color.bgCyan(color.gray(` ${option.value} `))} ${option.label} ${color.dim(
				`(${option.hint})`
			)}`
		);
		option.hint = undefined;
		expect(opt(option, 'active')).toBe(
			`${color.bgCyan(color.gray(` ${option.value} `))} ${option.label}`
		);
		expect(opt(option, 'cancelled')).toBe(`${color.strikethrough(color.dim(option.label))}`);
		option.hint = hint;
		expect(opt(option, 'inactive')).toBe(
			`${color.gray(color.bgWhite(color.inverse(` ${option.value} `)))} ${option.label} ${color.dim(
				`(${option.hint})`
			)}`
		);
		option.hint = undefined;
		expect(opt(option, 'inactive')).toBe(
			`${color.gray(color.bgWhite(color.inverse(` ${option.value} `)))} ${option.label}`
		);
		option.label = undefined;
		expect(opt(option)).toBe(
			`${color.gray(color.bgWhite(color.inverse(` ${option.value} `)))} ${option.value}`
		);
	});

	it('should render initial state', () => {
		selectKey({ message, options });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render initial state with initialValue', () => {
		selectKey({ message, options, initialValue: options[1].value[0] });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render cancel', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		selectKey({ message, options });
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${opt(options[0], 'cancelled')}\n${color.gray(S_BAR)}`
		);
	});

	it('should submit value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		selectKey({ message, options });
		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}  ${opt(options[0], 'selected')}`);
	});

	it('should return value on submit', async () => {
		const promise = selectKey({ message, options });

		mock.submit();
		const result = await promise;

		expect(result).toBe(options[0].value);
	});

	it('should return value on select key', async () => {
		const promise = selectKey({ message, options });

		mock.emit('key', options[1].value[0]);
		const result = await promise;

		expect(result).toBe(options[1].value);
	});
});
