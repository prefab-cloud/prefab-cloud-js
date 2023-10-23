import Context from "./context";
import base64Encode from "./base64Encode";
import version from "./version";

const headers = (apiKey: string) => ({
  Authorization: `Basic ${base64Encode(`u:${apiKey}`)}`,
  "X-PrefabCloud-Client-Version": `prefab-cloud-js-${version}`,
});

export const DEFAULT_TIMEOUT = 10000;

export type LoaderParams = {
  apiKey: string;
  context: Context;
  endpoints?: string[] | undefined;
  apiEndpoint?: string | undefined;
  timeout?: number;
};

export default class Loader {
  apiKey: string;

  context: Context;

  endpoints: string[];

  apiEndpoint: string;

  timeout: number;

  abortTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor({
    apiKey,
    context,
    endpoints = undefined,
    apiEndpoint = undefined,
    timeout,
  }: LoaderParams) {
    this.apiKey = apiKey;
    this.context = context;
    this.endpoints = endpoints || [
      "https://api-prefab-cloud.global.ssl.fastly.net/api/v1",
      "https://api.prefab.cloud/api/v1",
    ];
    this.apiEndpoint = apiEndpoint || "https://api.prefab.cloud/api/v1";
    this.timeout = timeout || DEFAULT_TIMEOUT;
  }

  url(root: string) {
    return `${root}/configs/eval-with-context/${this.context.encode()}`;
  }

  loadFromEndpoint(
    index: number,
    options: object,
    resolve: (value: any) => void,
    reject: (value: any) => void
  ) {
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

  static postUrl(root: string) {
    return `${root}/api/v1/telemetry`;
  }

  postToEndpoint(
    index: number,
    options: object,
    data: any,
    resolve: (value: any) => void,
    reject: (value: any) => void
  ) {
    const controller = new AbortController() as AbortController;
    const signal = controller?.signal;

    const url = Loader.postUrl(this.apiEndpoint);

    fetch(url, { signal, ...options })
      .then((response) => {
        this.clearAbortTimeout();

        if (response.ok) {
          return response.json();
        }
        throw new Error(`${response.status} ${response.statusText}`);
      })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        this.clearAbortTimeout();

        reject(error);
      });

    this.abortTimeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);
  }

  post(data: any) {
    const options = {
      method: "POST",
      headers: {
        ...headers(this.apiKey),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    };

    const promise = new Promise((resolve, reject) => {
      this.postToEndpoint(0, options, data, resolve, reject);
    });

    return promise;
  }
}
