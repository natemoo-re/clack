/**
 * `Jest` does not fully support ESM. Because of it do NOT remove these mocks!
 *
 * Related Jest Issue:
 * 	title: Native support for ES Modules #9430
 * 	url: https://github.com/jestjs/jest/issues/9430
 **/

jest.mock('wrap-ansi', () => (str: string) => str);

jest.mock('is-unicode-supported', () => () => true);
