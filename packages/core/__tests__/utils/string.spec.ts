import { diffLines } from '../../src/utils';

describe('String Utils', () => {
	it('should return `undefined` if there is no diff line', () => {
		const input = 'Lorem Ipsum is simply dummy text\n of the printing \nand typesetting industry.';

		expect(diffLines(input, input)).toBeUndefined();
	});

	it('should return a list with the index of each diff line', () => {
		const inputA =
			'Lorem Ipsum is simply dummy\n text\n of the \nprinting\n \nand typesetting industry.';
		const inputB =
			'Lorem Ipsum is simply dummy\n \ntext of the \nprinting\n and\n typesetting industry.';

		expect(diffLines(inputA, inputB)).toStrictEqual([1, 2, 4, 5]);
	});
});
