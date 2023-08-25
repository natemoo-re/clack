import type { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { theme } from './theme';

let terminal: Terminal | undefined;
export async function createTerminal(element: HTMLElement) {
  element.innerHTML = '';

  if (terminal) {
    terminal.options.theme = theme;
    terminal.open(element);

    return terminal;
  }

  const xterm = await import('xterm');
  const xtermAddonFit = await import('xterm-addon-fit');
  const xtermAddonWebLinks = await import('xterm-addon-web-links');
  const { Terminal } = xterm;
  const { FitAddon } = xtermAddonFit;
  const { WebLinksAddon } = xtermAddonWebLinks;

  terminal = new Terminal({
    convertEol: true,
    cursorBlink: false,
    disableStdin: false,
    theme,
    fontSize: 14,
    fontFamily: 'Menlo, courier-new, courier, monospace',
  });

  terminal.open(element);

  // we attach a FitAddon instance to help with resizing. Every time
  // we feel like the terminal element has changed size, we'll use the
  // addon to force a re-render
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(new WebLinksAddon());

  fitAddon.fit();

  // attach a `fit()` method to the terminal so we can easily resize it
  terminal = Object.assign(terminal, {
    fit() {
      fitAddon.fit();
    }
  });

  return terminal;
}
