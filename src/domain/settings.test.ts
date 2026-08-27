import { DEFAULT_SETTINGS, toggleDarkMode } from './settings';

test('defaults to light mode', () => {
  expect(DEFAULT_SETTINGS).toEqual({ darkMode: false });
});

describe('toggleDarkMode', () => {
  test('turns dark mode on', () => {
    expect(toggleDarkMode({ darkMode: false })).toEqual({ darkMode: true });
  });

  test('turns dark mode off', () => {
    expect(toggleDarkMode({ darkMode: true })).toEqual({ darkMode: false });
  });
});
