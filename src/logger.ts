const debug = Boolean(process.env.DEBUG);

type Loggable = object | number | string | boolean;

export default {
  debug(...args: Loggable[]): void {
    if (debug) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
  error(...args: Loggable[]): void {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
  info(...args: Loggable[]): void {
    // eslint-disable-next-line no-console
    console.info(...args);
  },
  warn(...args: Loggable[]): void {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
};
