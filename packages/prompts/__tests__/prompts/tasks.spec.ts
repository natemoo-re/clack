import { randomUUID } from 'crypto';
import { Task, tasks } from '../../src';

const startSpy = jest.fn();
const messageSpy = jest.fn();
const stopSpy = jest.fn();

jest.mock('../../src/prompts/spinner', () => () => ({
	start: startSpy,
	message: messageSpy,
	stop: stopSpy,
}));

describe('tasks', () => {
	it('should start tasks in sequence', async () => {
		const length = 3;
		let data: Task[] = Array.from(Array(length).keys()).map((i) => ({
			title: String(i),
			async task(message) {},
		}));

		await tasks(data);

		expect.assertions(length);
		for (let i = 0; i < length; i++) {
			expect(startSpy).toHaveBeenNthCalledWith(i + 1, String(i));
		}
	});

	it('should skip disabled task', async () => {
		const length = 3;
		let data: Task[] = Array.from(Array(length).keys()).map((i) => ({
			title: String(i),
			enabled: !(i === 1),
			async task(message) {},
		}));

		await tasks(data);

		expect(startSpy).toHaveBeenNthCalledWith(1, String(0));
		expect(startSpy).toHaveBeenNthCalledWith(2, String(2));
	});

	it('should stop tasks in sequence', async () => {
		const length = 3;
		let data: Task[] = Array.from(Array(length).keys()).map((i) => ({
			title: String(i),
			async task(message) {},
		}));

		await tasks(data);

		expect.assertions(length);
		for (let i = 0; i < length; i++) {
			expect(stopSpy).toHaveBeenNthCalledWith(i + 1, String(i));
		}
	});

	it('should update task message', async () => {
		const msg = randomUUID();

		await tasks([
			{
				title: '',
				task(message) {
					message(msg);
				},
			},
		]);

		expect(messageSpy).toHaveBeenCalledWith(msg);
	});

	it('should stop task with returned message', async () => {
		const msg = randomUUID();

		await tasks([
			{
				title: '',
				task() {
					return msg;
				},
			},
		]);

		expect(stopSpy).toHaveBeenCalledWith(msg);
	});
});
