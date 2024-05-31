import ConfigKey from "./configKey";
import ConfigValue from "./configValue";

export type ConfigEvaluationMetadata = {
  configRowIndex: number;
  conditionalValueIndex: number;
  type: string;
  configId: string;
};

const valueFor = (value: { [key: string]: any }, type: string, key: string): ConfigValue => {
  switch (type) {
    case "json":
      try {
        return JSON.parse(value[type]);
      } catch (e) {
        console.error(`Error parsing JSON from Prefab config ${key}`, e, value[type]);
        return value[type].json;
      }
    case "duration":
      return {
        seconds: Number(value[type].seconds),
        ms: Number(value[type].seconds) * 1000,
      };
    default:
      return value[type];
  }
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

  static digest(rawValues: { [key: string]: any }) {
    const configs = {} as { [key: string]: Config };

    Object.keys(rawValues || {}).forEach((key) => {
      const value = rawValues[key];

      if (typeof value === "object") {
        const type = Object.keys(value)[0];

        configs[key] = new Config(
          key,
          valueFor(value, type, key),
          type,
          value.configEvaluationMetadata
            ? this.parseRawMetadata(value.configEvaluationMetadata)
            : undefined
        );
      } else {
        configs[key] = new Config(key, value, "unknown");
      }
    });

    return configs;
  }

  static parseRawMetadata(metadata: any) {
    return {
      configRowIndex: parseInt(metadata.configRowIndex, 10),
      conditionalValueIndex: parseInt(metadata.conditionalValueIndex, 10),
      type: metadata.type,
      configId: metadata.id,
    };
  }
}
