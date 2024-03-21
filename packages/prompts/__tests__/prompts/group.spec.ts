import { group, mockPrompt, text } from '../../src';

describe('group', () => {
	const mock = mockPrompt();

	it('should inject prev results', (done) => {
		group({
			foo: async () => 'Foo',
			bar: async () => true,
			baz: async () => [1, 2, 3],
			tee: async ({ results }) => {
				results.foo === 'Foo' &&
				results.bar === true &&
				results.baz![0] === 1 &&
				results.gee === undefined
					? done()
					: done(`invalid results: ${JSON.stringify(results, null, 2)}`);
			},
			gee: async () => 0,
		});
	});

	it('should not cancel group on `prompt.cancel`', (done) => {
		group({
			foo: () => text({ message: '' }),
			bar: () => done(),
		});

		mock.cancel();
	});

	it('should call onCancel callback on `prompt.cancel`', (done) => {
		group(
			{
				foo: async () => true,
				bar: () => {
					const promise = text({ message: '' });
					mock.cancel();
					return promise;
				},
				baz: async () => false,
			},
			{
				onCancel: ({ results }) => {
					results.foo === true && results.baz === undefined
						? done()
						: done(`invalid results: ${JSON.stringify(results, null, 2)}`);
				},
			}
		);
	});

	it('should throw on error', async () => {
		const promise = group({
			foo: () => {
				throw new Error();
			},
		});

		await expect(promise).rejects.toThrow();
	});
});
