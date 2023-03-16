import Config from './config';
import ConfigValue from './configValue';
import Identity from './identity';
import Loader from './loader';

type InitRequest = {
  apiKey: string;
  identity: Identity;
  endpoints?: string[] | undefined;
  timeout?: number;
};

export const prefab = {
  configs: {} as { [key: string]: Config },

  loaded: false as boolean,

  loader: undefined as Loader | undefined,

  async init({
    apiKey, identity, endpoints = undefined, timeout = undefined,
  }: InitRequest) {
    this.loader = new Loader({
      apiKey,
      identity,
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
