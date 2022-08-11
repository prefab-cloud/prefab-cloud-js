import Identity from './identity';
import base64Encode from './base64Encode';

const headers = (apiKey: string) => ({
  Authorization: `Basic ${base64Encode(`u:${apiKey}`)}`,
});

const apiHash = (apiKey: string) => base64Encode(apiKey);

export default class Loader {
  apiKey: string;

  identity: Identity;

  endpoints: string[];

  constructor({
    apiKey, identity, endpoints = undefined,
  } : {apiKey: string, identity: Identity, endpoints?: string[] | undefined }) {
    this.apiKey = apiKey;
    this.identity = identity;
    this.endpoints = endpoints || [
      'https://api-prefab-cloud.global.ssl.fastly.net/api/v1',
    ];
  }

  url(root: string) {
    return `${root}/feature_flags/${apiHash(this.apiKey)}/${this.identity.encode()}`;
  }

  loadFromEndpoint(index : number, options: object, resolve : Function, reject : Function) {
    const endpoint = this.endpoints[index];
    const url = this.url(endpoint);

    fetch(url, options)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`${response.status} ${response.statusText}`);
      }).then((data) => {
        resolve(data.values);
      }).catch((error) => {
        if (index < this.endpoints.length - 1) {
          this.loadFromEndpoint(index + 1, options, resolve, reject);
        } else {
          reject(error);
        }
      });
  }

  load() {
    const options = { headers: headers(this.apiKey) };

    const promise = new Promise((resolve, reject) => {
      this.loadFromEndpoint(0, options, resolve, reject);
    });

    return promise;
  }
}
