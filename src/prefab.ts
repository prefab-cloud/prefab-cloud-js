import Config from './config';
import ConfigValue from './configValue';
import Identity from './identity';
import Loader from './loader';

const prefab = {
  configs: {} as {[key: string]: Config},

  loaded: false as boolean,

  async init({
    apiKey, identity, endpoints = undefined,
  }: {apiKey: string, identity: Identity, endpoints?: string[] | undefined }) {
    const loader = new Loader({
      apiKey, identity, endpoints,
    });

    return loader.load().then((rawValues: any) => {
      this.setConfig(rawValues);
    });
  },

  setConfig(rawValues: {[key: string]: any}) {
    this.configs = Config.digest(rawValues);
  },

  isEnabled(key: string) : boolean {
    return this.get(key) === true;
  },

  get(key: string) : ConfigValue {
    return this.configs[key]?.value;
  },
};

export default prefab;
