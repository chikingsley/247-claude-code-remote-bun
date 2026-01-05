import * as pty from '@homebridge/node-pty-prebuilt-multiarch';

export interface Terminal {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  onData(callback: (data: string) => void): void;
  onExit(callback: (info: { exitCode: number }) => void): void;
  kill(): void;
}

export function createTerminal(cwd: string, sessionName: string): Terminal {
  // Use prebuilt node-pty for better compatibility
  const shell = pty.spawn('/bin/zsh', [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      PATH: `/opt/homebrew/bin:${process.env.PATH}`,
    } as { [key: string]: string },
  });

  return {
    write: (data) => shell.write(data),
    resize: (cols, rows) => shell.resize(cols, rows),
    onData: (callback) => shell.onData(callback),
    onExit: (callback) => shell.onExit(callback),
    kill: () => shell.kill(),
  };
}
