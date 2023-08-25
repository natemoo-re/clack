import type { WebContainerProcess } from '@webcontainer/api';
import { WebContainer } from '@webcontainer/api';
import { createTerminal } from './terminal.js';
import pDefer from 'p-defer';

let webcontainer: Promise<WebContainer | undefined>;
let currentProcess: WebContainerProcess;
let shellWriter: WritableStreamDefaultWriter<string>;
const terminalEl = document.querySelector<HTMLElement>('#terminal')!;

window.addEventListener('load', async () => {
  const terminal = await createTerminal(terminalEl);
  webcontainer = bootWebContainer(terminal);
  await webcontainer;
});

/**
 * Checks if WebContainer is supported on the current browser.
 */
function isWebContainerSupported() {
  const hasSharedArrayBuffer = 'SharedArrayBuffer' in window;
  const looksLikeChrome = navigator.userAgent.toLowerCase().includes('chrome');
  const looksLikeFirefox = navigator.userAgent.includes('Firefox');

  if (hasSharedArrayBuffer && (looksLikeChrome || looksLikeFirefox)) {
    return true;
  }

  // Allow overriding the support check with localStorage.webcontainer_any_ua = 1
  try {
    return Boolean(localStorage.getItem('webcontainer_any_ua'));
  } catch {
    return false;
  }
}

async function bootWebContainer(terminal: import('xterm').Terminal) {
  if (!isWebContainerSupported()) {
    terminal.reset();
    terminal.write(
        [
          'Incompatible Web Browser',
          '',
          `WebContainers currently work in Chromium-based browsers and Firefox. We're hoping to add support for more browsers as they implement the necessary Web Platform features.`,
          '',
          'Read more about browser support:',
          'https://webcontainers.io/guides/browser-support',
          ''
        ].join('\n'),
      );

    return;
  }

	// If the instance is already booted, return it
  if (webcontainer) {
    return webcontainer;
  }

	// Create a new instance of the WebContainer
  const ESC = '\x1B';
  const CSI = `${ESC}[`;
  terminal.write(`${CSI}?25l`);

  webcontainer = WebContainer.boot();

  try {
    const filetree = JSON.parse(document.querySelector('#filetree')!.innerHTML);
    const wc = await webcontainer;

    terminal.reset();

    wc!.mount(filetree);

    async function main() {
      // we set an infinite loop so that when the user runs the `exit` command, we restart
      while (true) {
        currentProcess = await wc!.spawn('jsh', {
          terminal: {
            cols: terminal.cols,
            rows: terminal.rows,
          },
        });

        const jshReady = pDefer();
        let isJSHReady = false;

        // write the process output to the terminal
        currentProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (data.includes('❯') && !isJSHReady) {
                isJSHReady = true;

                jshReady.resolve();
              }

              terminal.write(data);
            },
          })
        );

        shellWriter = currentProcess.input.getWriter();

        await jshReady.promise;

        shellWriter.write('clear && node index.js\n');

        // write the terminal input to the process
        const terminalWriter = terminal.onData((data) => {
          shellWriter.write(data);
        });

        // wait for the process to finish
        await currentProcess.exit;

        terminal.clear();
        terminalWriter.dispose();
      }
    }

    main();
  } catch {
    // terminal.write(
    //   wordWrap(
    //     [
    //       `\x1b[G${red(`Looks like your browser's configuration is blocking WebContainers.`)}`,
    //       '',
    //       `Let's troubleshoot this!`,
    //       '',
    //       'Read more at:',
    //       'https://webcontainers.io/guides/browser-config',
    //       ''
    //     ].join('\n'),
    //     terminal.cols,
    //   )
    // );
  }

  return webcontainer;
}
