import Identity from './identity';
import base64Encode from './base64Encode';
import version from './version';

const headers = (apiKey: string) => ({
  Authorization: `Basic ${base64Encode(`u:${apiKey}`)}`,
  'X-PrefabCloud-Client-Version': `prefab-cloud-js${version}`,
});

export const DEFAULT_TIMEOUT = 10000;

export default class Loader {
  apiKey: string;

  identity: Identity;

  endpoints: string[];

  timeout: number;

  abortTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor({
    apiKey, identity, endpoints = undefined, timeout,
  } : {apiKey: string, identity: Identity, endpoints?: string[] | undefined, timeout?: number }) {
    this.apiKey = apiKey;
    this.identity = identity;
    this.endpoints = endpoints || [
      'https://api-prefab-cloud.global.ssl.fastly.net/api/v1',
      'https://api.prefab.cloud/api/v1',
    ];
    this.timeout = timeout || DEFAULT_TIMEOUT;
  }

  url(root: string) {
    return `${root}/configs/eval/${this.identity.encode()}`;
  }

  loadFromEndpoint(index : number, options: object, resolve : Function, reject : Function) {
    const controller = new AbortController() as AbortController;
    const signal = controller?.signal;

    const endpoint = this.endpoints[index];
    const url = this.url(endpoint);

    fetch(url, { signal, ...options })
      .then((response) => {
        this.clearAbortTimeout();

        if (response.ok) {
          return response.json();
        }
        throw new Error(`${response.status} ${response.statusText}`);
      }).then((data) => {
        resolve(data.values);
      }).catch((error) => {
        this.clearAbortTimeout();

        if (index < this.endpoints.length - 1) {
          this.loadFromEndpoint(index + 1, options, resolve, reject);
        } else {
          reject(error);
        }
      });

    this.abortTimeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);
  }

  load() {
    const options = { headers: headers(this.apiKey) };

    const promise = new Promise((resolve, reject) => {
      this.loadFromEndpoint(0, options, resolve, reject);
    });

    return promise;
  }

  clearAbortTimeout() {
    clearTimeout(this.abortTimeoutId);
  }
}
