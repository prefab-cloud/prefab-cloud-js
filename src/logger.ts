export const PREFIX = "log-level.";
import ConfigValue from "./configValue";

const WORD_LEVEL_LOOKUP: Readonly<Record<string, number>> = {
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 5,
  ERROR: 6,
  FATAL: 9,
};

export const shouldLog = ({
  loggerName,
  desiredLevel,
  defaultLevel,
  get,
}: {
  loggerName: string;
  desiredLevel: string;
  defaultLevel: string;
  get: (key: string) => ConfigValue;
}): boolean => {
  let loggerNameWithPrefix = PREFIX + loggerName;
  const desiredLevelNumber = WORD_LEVEL_LOOKUP[desiredLevel.toUpperCase()];

  while (loggerNameWithPrefix.length > 0) {
    const resolvedLevel = get(loggerNameWithPrefix);

    if (resolvedLevel !== undefined) {
      return WORD_LEVEL_LOOKUP[resolvedLevel.toString()] <= desiredLevelNumber;
    }

    if (loggerNameWithPrefix.indexOf(".") === -1) {
      break;
    }

    loggerNameWithPrefix = loggerNameWithPrefix.slice(
      0,
      loggerNameWithPrefix.lastIndexOf(".")
    );
  }

  return WORD_LEVEL_LOOKUP[defaultLevel.toUpperCase()] <= desiredLevelNumber;
};
