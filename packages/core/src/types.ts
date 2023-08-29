import { KEYS } from './utils';

export type InferSetType<T> = T extends Set<infer U> ? U : never;

/**
 * The state of the prompt
 */
export type ClackState = 'initial' | 'active' | 'cancel' | 'submit' | 'error';

/**
 * Typed event emitter for clack
 */
export interface ClackEvents {
	initial: (value?: any) => void;
	active: (value?: any) => void;
	cancel: (value?: any) => void;
	submit: (value?: any) => void;
	error: (value?: any) => void;
	cursor: (key?: InferSetType<typeof KEYS>) => void;
	key: (key?: string) => void;
	value: (value?: string) => void;
	confirm: (value?: boolean) => void;
	finalize: () => void;
}
