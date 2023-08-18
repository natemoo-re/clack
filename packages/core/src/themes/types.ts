import Prompt from '../prompts/prompt';

export interface TemplateOptions {
	ctx: Omit<Prompt, 'prompt'>;
	message: string;
	value: string;
	valueWithCursor: string | undefined;
	placeholder?: string | undefined;
	error?: string | undefined;
}
