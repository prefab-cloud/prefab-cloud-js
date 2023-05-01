import Config from './config';
import ConfigValue from './configValue';
import Context from './context';
import Identity from './identity';
import Loader from './loader';

type InitParams = {
  apiKey: string;
  identity?: Identity;
  context?: Context;
  endpoints?: string[] | undefined;
  timeout?: number;
};

export const prefab = {
  configs: {} as { [key: string]: Config },

  loaded: false as boolean,

  loader: undefined as Loader | undefined,

  async init({
    apiKey,
    context: providedContext,
    identity,
    endpoints = undefined,
    timeout = undefined,
  }: InitParams) {
    const context = providedContext ?? identity?.toContext();

    if (!context) {
      throw new Error('Context must be provided');
    }

    this.loader = new Loader({
      apiKey,
      context,
      endpoints,
      timeout,
    });

    return this.loader.load().then((rawValues: any) => {
      this.setConfig(rawValues);
      this.loaded = true;
    });
  },

  setConfig(rawValues: { [key: string]: any }) {
    this.configs = Config.digest(rawValues);
  },

  isEnabled(key: string): boolean {
    return this.get(key) === true;
  },

  get(key: string): ConfigValue {
    return this.configs[key]?.value;
  },
};
