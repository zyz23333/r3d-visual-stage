import { writeFileLog } from './fileLogger';

const PREFIX = '[R3D Visual Stage]';

export function logInfo(message: string, details?: unknown): void {
  if (details === undefined) {
    console.info(`${PREFIX} ${message}`);
  } else {
    console.info(`${PREFIX} ${message}`, details);
  }

  writeFileLog('info', message, details);
}

export function logWarning(message: string, details?: unknown): void {
  if (details === undefined) {
    console.warn(`${PREFIX} ${message}`);
  } else {
    console.warn(`${PREFIX} ${message}`, details);
  }

  writeFileLog('warning', message, details);
}

export function logError(message: string, details?: unknown): void {
  if (details === undefined) {
    console.error(`${PREFIX} ${message}`);
  } else {
    console.error(`${PREFIX} ${message}`, details);
  }

  writeFileLog('error', message, details);
}
