import { mockPrompt, SelectPrompt } from '@clack/core';
import color from 'picocolors';
import { groupMultiselect } from '../../src';
import { opt } from '../../src/prompts/group-multiselect';
import {
	Option,
	symbol,
	S_BAR,
	S_BAR_END,
	S_CHECKBOX_ACTIVE,
	S_CHECKBOX_INACTIVE,
	S_CHECKBOX_SELECTED
} from '../../src/utils';

const options = {
	'changed packages': [{ value: '@scope/a' }, { value: '@scope/b' }, { value: '@scope/c' }],
	'unchanged packages': [{ value: '@scope/x' }, { value: '@scope/y' }, { value: '@scope/z' }],
} satisfies Record<string, Option<string>[]>;

describe('groupMultiselect', () => {
	const mock = mockPrompt<SelectPrompt<{ value: string }>>();
	const message = 'test message';

	afterEach(() => {
		mock.close();
	});

	it('should format group option', () => {
		const option: Option<string> & { group: boolean } = {
			label: 'Foo',
			value: 'foo',
			group: true,
		};

		groupMultiselect({ message, options });
		const label = option.label;

		expect(opt(option, 'group-active')).toBe(
			`${color.cyan(S_CHECKBOX_ACTIVE)} ${color.dim(label)}`
		);
		expect(opt(option, 'group-active-selected')).toBe(
			`${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`
		);
	});

	it('should format group option without label', () => {
		const option: Option<string> & { group: boolean } = {
			value: 'foo',
			group: true,
		};

		groupMultiselect({ message, options });
		const label = option.value;

		expect(opt(option, 'group-active')).toBe(
			`${color.cyan(S_CHECKBOX_ACTIVE)} ${color.dim(label)}`
		);
		expect(opt(option, 'group-active-selected')).toBe(
			`${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`
		);
	});

	it('should format option with hint', () => {
		const option: Option<string> & { group: string } = {
			label: 'Foo',
			value: 'foo',
			hint: 'bar',
			group: '',
		};

		groupMultiselect({ message, options });
		const hint = color.dim(`(${option.hint})`);
		const prefix = color.dim(`${S_BAR_END} `);
		const label = option.label;

		expect(opt(option, 'active')).toBe(
			`${prefix}${color.cyan(S_CHECKBOX_ACTIVE)} ${label} ${hint}`
		);
		expect(opt(option, 'active-selected')).toBe(
			`${prefix}${color.green(S_CHECKBOX_SELECTED)} ${label} ${hint}`
		);
	});

	it('should format option without hint', () => {
		const option: Option<string> & { group: string } = {
			label: 'Foo',
			value: 'foo',
			group: '',
		};

		groupMultiselect({ message, options });
		const prefix = color.dim(`${S_BAR_END} `);
		const label = option.label;

		expect(opt(option, 'active')).toBe(`${prefix}${color.cyan(S_CHECKBOX_ACTIVE)} ${label}`);
		expect(opt(option, 'active-selected')).toBe(
			`${prefix}${color.green(S_CHECKBOX_SELECTED)} ${label}`
		);
		expect(opt(option, 'selected')).toBe(
			`${prefix}${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`
		);
		expect(opt(option, 'cancelled')).toBe(`${color.strikethrough(color.dim(label))}`);
		expect(opt(option, 'submitted')).toBe(`${color.dim(label)}`);
		expect(opt(option, 'inactive')).toBe(
			`${prefix}${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`
		);
	});

	it('should format option without label', () => {
		const option: Option<string> & { group: string } = {
			value: 'foo',
			group: '',
		};

		groupMultiselect({ message, options });
		const prefix = `${S_BAR_END} `;
		const label = option.value;

		expect(opt(option, 'active')).toBe(
			`${color.dim(prefix)}${color.cyan(S_CHECKBOX_ACTIVE)} ${label}`
		);
		expect(opt(option, 'active-selected')).toBe(
			`${color.dim(prefix)}${color.green(S_CHECKBOX_SELECTED)} ${label}`
		);
		expect(opt(option, 'selected')).toBe(
			`${color.dim(prefix)}${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}`
		);
		expect(opt(option, 'cancelled')).toBe(`${color.strikethrough(color.dim(label))}`);
		expect(opt(option, 'submitted')).toBe(`${color.dim(label)}`);
		expect(opt(option, 'inactive')).toBe(
			`${color.dim(prefix)}${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`
		);
	});

	it('should render initial state', () => {
		groupMultiselect({ message, options });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render initial with group active', () => {
		groupMultiselect({ message, options });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render initial with group selected', () => {
		groupMultiselect({ message, options, initialValues: ['changed packages'] });

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render initial state with option active', () => {
		groupMultiselect({
			message,
			options,
			cursorAt: options['changed packages'][0].value,
		});

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render initial state with option active and selected', () => {
		groupMultiselect({
			message,
			options,
			initialValues: [options['changed packages'][0].value],
			cursorAt: options['changed packages'][0].value,
		});

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render initial state with option not active and selected', () => {
		groupMultiselect({
			message,
			options,
			initialValues: [options['changed packages'][0].value],
			cursorAt: options['changed packages'][1].value,
		});

		expect(mock.state).toBe('initial');
		expect(mock.frame).toMatchSnapshot();
	});

	it('should render error', () => {
		groupMultiselect({ message, options });
		mock.submit();

		expect(mock.state).toBe('error');
		expect(mock.frame).toMatchSnapshot();
	});

	// Implement when `groupMultiselect.validate` be exposed
	it.todo('should render error with option selected');

	// Implement when `groupMultiselect.validate` be exposed
	it.todo('should render error with option active and selected');

	it('should render cancel', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		groupMultiselect({ message, options });
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(`${title}${color.gray(S_BAR)}`);
	});

	it('should render cancel with group selected', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('cancel')}  ${message}\n`;

		const selectedOptions = options['changed packages'];
		groupMultiselect({
			message,
			options,
			initialValues: selectedOptions.map((item) => item.value),
		});
		mock.cancel();

		expect(mock.state).toBe('cancel');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${selectedOptions
				.map((option) => opt(option, 'cancelled'))
				.join(color.dim(', '))}\n${color.gray(S_BAR)}`
		);
	});

	it('should submit value', () => {
		const title = `${color.gray(S_BAR)}\n${symbol('submit')}  ${message}\n`;

		const selectedOptions = options['changed packages'];
		groupMultiselect({
			message,
			options,
			initialValues: selectedOptions.map((item) => item.value),
		});
		mock.submit();

		expect(mock.state).toBe('submit');
		expect(mock.frame).toBe(
			`${title}${color.gray(S_BAR)}  ${selectedOptions
				.map((option) => opt(option, 'submitted'))
				.join(color.dim(', '))}`
		);
	});

	it('should return value on submit', async () => {
		const value = options['changed packages'].map((item) => item.value);

		const promise = groupMultiselect({ message, options, initialValues: value });
		mock.submit();
		const result = await promise;

		expect(result).toStrictEqual(value);
	});
});
