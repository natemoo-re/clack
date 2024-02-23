import type { Key } from 'node:readline';
import Prompt from '../prompts/prompt';
import { ClackState } from '../types';

export type MockResult<TPrompt extends Prompt = Prompt> = TPrompt & {
	frame: string;
	pressKey: (char: string, key: Key) => void;
	setCursor: (cursor: number) => void;
	setState: (state: ClackState) => void;
	setValue: (value: any) => void;
	setIsTestMode: (state: boolean) => void;
	cancel: (value?: any) => void;
	submit: (value?: any) => void;
	close: () => void;
	updateFrame: () => void;
};

export let isTestMode = false;

const _mockResult: Partial<MockResult> = {
	setIsTestMode(state) {
		isTestMode = state;
	},
};

export function mockPrompt<TPrompt extends Prompt = Prompt>(): MockResult<TPrompt> {
	isTestMode = true;
	return _mockResult as MockResult<TPrompt>;
}

export function exposeTestUtils<TPrompt extends Prompt = Prompt>(
	params: Partial<MockResult<TPrompt>>
): void {
	Object.assign(_mockResult, params);
}
