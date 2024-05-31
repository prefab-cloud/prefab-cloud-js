export type Duration = {
  seconds: number;
  ms: number;
};

type ConfigValue = number | string | boolean | object | Duration | undefined;

export default ConfigValue;
