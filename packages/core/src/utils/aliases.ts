import type { InferSetType } from '../types';

const DEFAULT_KEYS = ['up', 'down', 'left', 'right', 'space', 'enter', 'cancel'] as const;
export const KEYS = new Set(DEFAULT_KEYS);

export const ALIASES = new Map<string, InferSetType<typeof KEYS>>([
	['k', 'up'],
	['j', 'down'],
	['h', 'left'],
	['l', 'right'],
	['\x03', 'cancel'],
]);

/**
 * Set custom global aliases for the default keys - This will not overwrite existing aliases just add new ones
 *
 * @param aliases - A map of aliases to keys
 * @default
 * new Map([['k', 'up'], ['j', 'down'], ['h', 'left'], ['l', 'right'], ['\x03', 'cancel'],])
 */
export function setGlobalAliases(alias: Array<[string, InferSetType<typeof KEYS>]>): void {
	for (const [newAlias, key] of alias) {
		if (!ALIASES.has(newAlias)) {
			ALIASES.set(newAlias, key);
		}
	}
}

/**
 * Check if a key is an alias for a default key
 * @param key - The key to check for
 * @param type - The type of key to check for
 * @returns boolean
 */
export function hasAliasKey(
	key: string | Array<string | undefined>,
	type: InferSetType<typeof KEYS>
): boolean {
	if (typeof key === 'string') {
		return ALIASES.has(key) && ALIASES.get(key) === type;
	}

	return key
		.map((n) => {
			if (n !== undefined && ALIASES.has(n) && ALIASES.get(n) === type) return true;
			return false;
		})
		.includes(true);
}
