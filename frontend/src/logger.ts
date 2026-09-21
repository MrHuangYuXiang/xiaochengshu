class Logger {
  constructor() { }

  debug(msg: string) {
    if (import.meta.env.DEV) {
      console.debug(msg);
    }
  }
}

export const logger = new Logger();
