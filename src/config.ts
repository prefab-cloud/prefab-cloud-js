import ConfigKey from './configKey';
import ConfigValue from './configValue';

export default class Config {
  key: ConfigKey;

  value: ConfigValue;

  type: string;

  constructor(key: ConfigKey, value: ConfigValue, type: string) {
    this.key = key;
    this.value = value;
    this.type = type;
  }

  static digest(rawValues: {[key: string]: any}) {
    const configs = {} as {[key: string]: Config};

    Object.keys(rawValues).forEach((key) => {
      const obj = rawValues[key];
      const type = Object.keys(obj)[0];

      configs[key] = new Config(key, obj[type], type);
    });

    return configs;
  }
}
