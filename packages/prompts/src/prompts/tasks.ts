import spinner from './spinner';

export type Task = {
	/**
	 * Task title
	 */
	title: string;
	/**
	 * Task function
	 */
	task: (message: (string: string) => void) => string | Promise<string> | void | Promise<void>;

	/**
	 * If enabled === false the task will be skipped
	 */
	enabled?: boolean;
};

/**
 * Define a group of tasks to be executed
 */
const tasks = async (tasks: Task[]) => {
	for (const task of tasks) {
		if (task.enabled === false) continue;

		const s = spinner();
		s.start(task.title);
		const result = await task.task(s.message);
		s.stop(result || task.title);
	}
};

export default tasks;
