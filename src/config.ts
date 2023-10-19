import ConfigKey from './configKey';
import ConfigValue from './configValue';

export type ConfigEvaluationMetadata = {
  configRowIndex: number;
  conditionalValueIndex: number;
  type: string;
};

export class Config {
  key: ConfigKey;

  value: ConfigValue;

  type: string;

  configEvaluationMetadata: ConfigEvaluationMetadata | undefined;

  constructor(
    key: ConfigKey,
    value: ConfigValue,
    type: string,
    metadata?: ConfigEvaluationMetadata
  ) {
    this.key = key;
    this.value = value;
    this.type = type;
    this.configEvaluationMetadata = metadata;
  }

  static digest(rawValues: {[key: string]: any}) {
    const configs = {} as {[key: string]: Config};

    Object.keys(rawValues || {}).forEach((key) => {
      const value = rawValues[key];

      if (typeof value === 'object') {
        const type = Object.keys(value)[0];

        configs[key] = new Config(key, value[type], type, value.configEvaluationMetadata);
      } else {
        configs[key] = new Config(key, value, 'unknown');
      }
    });

    return configs;
  }
}
