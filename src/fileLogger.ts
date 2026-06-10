import type { CharacterDisplayConfig } from './config';

type FsModule = typeof import('node:fs');
type PathModule = typeof import('node:path');

let fileLogger: FileLogger | undefined;

export function installFileLogger(config: CharacterDisplayConfig): void {
  if (!config.fileLogging) {
    return;
  }

  fileLogger = FileLogger.create(config.logFilePath, config.timestampLogFile);
  if (!fileLogger) {
    return;
  }

  fileLogger.write('info', 'File logger installed.');
  window.addEventListener('error', (event) => {
    fileLogger?.write('error', 'window error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: serializeDetails(event.error),
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    fileLogger?.write('error', 'unhandled promise rejection', serializeDetails(event.reason));
  });
}

export function writeFileLog(level: string, message: string, details?: unknown): void {
  fileLogger?.write(level, message, details);
}

class FileLogger {
  private constructor(
    private readonly fs: FsModule,
    private readonly logPath: string,
  ) {}

  public static create(relativeLogPath: string, timestampLogFile: boolean): FileLogger | undefined {
    if (!window.require || !window.process?.cwd) {
      console.warn('[R3D Visual Stage] File logging requires NW.js.');
      return undefined;
    }

    try {
      const fs = window.require('fs');
      const path = window.require('path');
      const basePath = window.process.cwd();
      const logPath = path.resolve(
        basePath,
        timestampLogFile ? appendTimestampToLogPath(path, relativeLogPath) : relativeLogPath,
      );
      ensureDirectoryExists(fs, path, path.dirname(logPath));
      fs.writeFileSync(logPath, `[${new Date().toISOString()}] info log started\n`, 'utf8');
      return new FileLogger(fs, logPath);
    } catch (error) {
      console.warn('[R3D Visual Stage] Failed to initialize file logging.', error);
      return undefined;
    }
  }

  public write(level: string, message: string, details?: unknown): void {
    try {
      const line = [
        `[${new Date().toISOString()}]`,
        level,
        message,
        details === undefined ? '' : JSON.stringify(serializeDetails(details)),
      ]
        .filter(Boolean)
        .join(' ');

      this.fs.appendFileSync(this.logPath, `${line}\n`, 'utf8');
    } catch (error) {
      console.warn('[R3D Visual Stage] Failed to write file log.', error);
    }
  }
}

function ensureDirectoryExists(fs: FsModule, path: PathModule, directoryPath: string): void {
  if (fs.existsSync(directoryPath)) {
    const stats = fs.statSync(directoryPath);
    if (stats.isDirectory()) {
      return;
    }

    throw new Error(`Log directory path exists but is not a directory: ${directoryPath}`);
  }

  const parentPath = path.dirname(directoryPath);
  if (parentPath !== directoryPath) {
    ensureDirectoryExists(fs, path, parentPath);
  }

  fs.mkdirSync(directoryPath);
}

function appendTimestampToLogPath(path: PathModule, relativeLogPath: string): string {
  const directoryPath = path.dirname(relativeLogPath);
  const extension = path.extname(relativeLogPath);
  const basename = path.basename(relativeLogPath, extension);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedName = `${basename}-${timestamp}${extension}`;

  return directoryPath === '.' ? timestampedName : path.join(directoryPath, timestampedName);
}

function serializeDetails(details: unknown): unknown {
  if (details instanceof Error) {
    return {
      name: details.name,
      message: details.message,
      stack: details.stack,
    };
  }

  if (details && typeof details === 'object') {
    try {
      return JSON.parse(JSON.stringify(details));
    } catch {
      return String(details);
    }
  }

  return details;
}
