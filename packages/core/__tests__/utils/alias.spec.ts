import { ALIASES, hasAliasKey, setGlobalAliases } from '../../src/utils';

describe('Alias', () => {
	describe('setGlobalAliases()', () => {
		it('should set custom global aliases for the default keys', () => {
			expect(ALIASES.get('u')).toBeUndefined();
			expect(ALIASES.get('t')).toBeUndefined();
			expect(ALIASES.get('c')).toBeUndefined();
			setGlobalAliases([
				['u', 'up'],
				['t', 'up'],
				['c', 'cancel'],
			]);
			expect(ALIASES.get('u')).toBe('up');
			expect(ALIASES.get('t')).toBe('up');
			expect(ALIASES.get('c')).toBe('cancel');
		});
	});

	describe('hasAliasKey()', () => {
		it('should check if a key is an alias for a default key', () => {
			ALIASES.delete('u');
			expect(hasAliasKey('u', 'up')).toBe(false);

			ALIASES.set('u', 'up');
			expect(hasAliasKey('u', 'up')).toBe(true);
		});

		it('should check if a key list has an alias for a default key', () => {
			ALIASES.delete('u');
			ALIASES.delete('t');
			expect(hasAliasKey(['u', 't'], 'up')).toBe(false);

			ALIASES.set('u', 'up');
			expect(hasAliasKey(['u', 't'], 'up')).toBe(true);

			ALIASES.delete('u');
			ALIASES.set('t', 'up');
			expect(hasAliasKey(['u', 't'], 'up')).toBe(true);

			ALIASES.delete('t');
			ALIASES.set('t', 'down');
			expect(hasAliasKey(['u', 't'], 'up')).toBe(false);
		});
	});
});
