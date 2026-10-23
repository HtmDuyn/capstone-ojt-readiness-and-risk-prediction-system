type LogArguments = unknown[];

export const logger = {
  info: (...args: LogArguments): void => {
    console.info(...args);
  },

  error: (...args: LogArguments): void => {
    console.error(...args);
  },

  warn: (...args: LogArguments): void => {
    console.warn(...args);
  },
};