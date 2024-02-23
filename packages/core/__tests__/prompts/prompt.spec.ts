import { randomUUID } from 'crypto';
import { mockPrompt, setGlobalAliases } from '../../src';
import Prompt, { PromptOptions } from '../../src/prompts/prompt';

const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

const makeSut = (opts?: Omit<PromptOptions<Prompt>, 'render'>, trackValue?: boolean) => {
	return new Prompt(
		{
			render() {
				return this.value;
			},
			...opts,
		},
		trackValue
	).prompt();
};

describe('Prompt', () => {
	const mock = mockPrompt();

	afterEach(() => {
		mock.close();
	});

	it('should set initialValue as value', () => {
		const value = randomUUID();

		makeSut({
			initialValue: value,
		});

		expect(mock.value).toBe(value);
	});

	it('should listen to event', () => {
		let counter = 0;
		makeSut();

		mock.on('value', () => {
			counter++;
		});
		for (let i = 0; i < 5; i++) {
			mock.emit('value', '');
		}

		expect(counter).toBe(5);
	});

	it('should listen to event just once', () => {
		let counter = 0;
		makeSut();

		mock.once('value', () => {
			counter++;
		});
		for (let i = 0; i < 5; i++) {
			mock.emit('value', '');
		}

		expect(counter).toBe(1);
	});

	it('should submit value', () => {
		const value = randomUUID();

		makeSut();
		mock.submit(value);

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe(value);
	});

	it('should cancel prompt', () => {
		const value = randomUUID();

		makeSut();
		mock.cancel(value);

		expect(mock.state).toBe('cancel');
		expect(mock.value).toBe(value);
	});

	it('should validate value', () => {
		const value = randomUUID();
		const error = 'invalid value';

		makeSut({
			validate(value) {
				return error;
			},
		});
		mock.submit(value);

		expect(mock.state).toBe('error');
		expect(mock.value).toBe(value);
		expect(mock.error).toBe(error);
	});

	it('should set prompt state as `active` after error', () => {
		makeSut();

		mock.setState('error');
		mock.pressKey('', { name: '' });

		expect(mock.state).toBe('active');
	});

	it('should emit `cursor` on press key alias', (done) => {
		setGlobalAliases([['c', 'cancel']]);
		makeSut({}, false);

		mock.on('cursor', (key) => {
			key === 'cancel' ? done() : done('invalid key received: ' + key);
		});
		mock.pressKey('', { name: 'c' });
	});

	it('should emit `cursor` on press internal key alias', (done) => {
		makeSut();

		mock.on('cursor', (key) => {
			key === 'cancel' ? done() : done('invalid key received: ' + key);
		});
		mock.pressKey('', { name: 'cancel' });
	});

	it('should emit `confirm` on press y/n', () => {
		makeSut();
		let counter = 0;

		mock.on('confirm', (key) => {
			counter++;
		});
		mock.pressKey('y', { name: '' });
		mock.pressKey('n', { name: '' });

		expect(counter).toBe(2);
	});

	it('should allow tab completion for placeholders', () => {
		const placeholder = randomUUID();
		makeSut({ initialValue: '', placeholder });

		mock.pressKey('\t', { name: 'tab' });

		expect(mock.value).toBe(placeholder);
	});

	it('should render prompt', () => {
		mock.setIsTestMode(false);
		const value = randomUUID();

		makeSut({
			initialValue: value,
		});

		expect(outputSpy).toHaveBeenCalledWith(value);
	});

	it('should update single line', () => {
		mock.setIsTestMode(false);
		const value = randomUUID();
		const char = 't';

		makeSut({
			initialValue: value,
		});
		mock.on('key', (key) => {
			mock.setValue(mock.value + key);
		});
		mock.pressKey(char, { name: char });

		expect(mock.frame).toBe(value + char);
		expect(outputSpy).toHaveBeenCalledWith(value + char);
	});

	it('should update frame', () => {
		mock.setIsTestMode(false);
		const value = randomUUID();
		const newValue = 't\ng';

		makeSut({ initialValue: value });
		mock.setValue(newValue);
		mock.pressKey('', { name: '' });

		expect(mock.frame).toBe(newValue);
		expect(outputSpy).toHaveBeenCalledWith(value);
		expect(outputSpy).toHaveBeenCalledWith(newValue);
	});
});
