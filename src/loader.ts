import { headers, DEFAULT_TIMEOUT } from "./apiHelpers";
import Context from "./context";

export type LoaderParams = {
  apiKey: string;
  context: Context;
  endpoints?: string[] | undefined;
  apiEndpoint?: string | undefined;
  timeout?: number;
  clientVersion?: string;
};

export type Headers = {
  [key: string]: string;
};

export type FetchOptions = {
  headers: Headers;
};

export default class Loader {
  apiKey: string;

  context: Context;

  endpoints: string[];

  apiEndpoint: string;

  timeout: number;

  abortTimeoutId: ReturnType<typeof setTimeout> | undefined;

  clientVersion: string;

  abortController: AbortController | undefined;

  constructor({
    apiKey,
    context,
    endpoints = undefined,
    apiEndpoint = undefined,
    timeout,
    clientVersion = "",
  }: LoaderParams) {
    this.apiKey = apiKey;
    this.context = context;
    this.endpoints = endpoints || [
      "https://api-prefab-cloud.global.ssl.fastly.net/api/v1",
      "https://api.prefab.cloud/api/v1",
    ];
    this.apiEndpoint = apiEndpoint || "https://api.prefab.cloud/api/v1";
    this.timeout = timeout || DEFAULT_TIMEOUT;
    this.clientVersion = clientVersion;
  }

  url(root: string) {
    return `${root}/configs/eval-with-context/${this.context.encode()}`;
  }

  loadFromEndpoint(
    index: number,
    options: FetchOptions,
    resolve: (value: any) => void,
    reject: (value: any) => void
  ) {
    this.abortController = new AbortController() as AbortController;
    const { signal } = this.abortController;

    const endpoint = this.endpoints[index];
    const url = this.url(endpoint);

    fetch(url, { signal, ...options })
      .then((response) => {
        this.clearAbortTimeout();

        if (response.ok) {
          return response.json();
        }
        throw new Error(`${response.status} ${response.statusText}`);
      })
      .then((data) => {
        resolve(data.values);
      })
      .catch((error) => {
        this.clearAbortTimeout();

        if (index < this.endpoints.length - 1) {
          this.loadFromEndpoint(index + 1, options, resolve, reject);
        } else {
          reject(error);
        }
      });

    this.abortTimeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.timeout);
  }

  load() {
    this.abortController?.abort();

    const options = { headers: headers(this.apiKey, this.clientVersion) };

    const promise = new Promise((resolve, reject) => {
      this.loadFromEndpoint(0, options, resolve, reject);
    });

    return promise;
  }

  clearAbortTimeout() {
    clearTimeout(this.abortTimeoutId);
  }
}
