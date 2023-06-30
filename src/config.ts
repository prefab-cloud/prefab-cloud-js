import ConfigKey from "./configKey";
import ConfigValue from "./configValue";

export default class Config {
  key: ConfigKey;

  value: ConfigValue;

  type: string;

  constructor(key: ConfigKey, value: ConfigValue, type: string) {
    this.key = key;
    this.value = value;
    this.type = type;
  }

  static digest(rawValues: { [key: string]: any }) {
    const configs = {} as { [key: string]: Config };

    Object.keys(rawValues || {}).forEach((key) => {
      const value = rawValues[key];

      if (typeof value === "object") {
        const type = Object.keys(value)[0];

        configs[key] = new Config(key, value[type], type);
      } else {
        configs[key] = new Config(key, value, "unknown");
      }
    });

    return configs;
  }
}
