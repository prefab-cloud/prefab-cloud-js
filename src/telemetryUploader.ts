import { headers, DEFAULT_TIMEOUT } from "./apiHelpers";

export type TelemetryUploaderParams = {
  apiKey: string;
  apiEndpoint?: string | undefined;
  timeout?: number;
};

export default class TelemetryUploader {
  apiKey: string;

  apiEndpoint: string;

  timeout: number;

  abortTimeoutId: ReturnType<typeof setTimeout> | undefined;

  constructor({ apiKey, apiEndpoint = undefined, timeout }: TelemetryUploaderParams) {
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint || "https://api.prefab.cloud/api/v1";
    this.timeout = timeout || DEFAULT_TIMEOUT;
  }

  clearAbortTimeout() {
    clearTimeout(this.abortTimeoutId);
  }

  static postUrl(root: string) {
    return `${root}/api/v1/telemetry`;
  }

  postToEndpoint(options: object, resolve: (value: any) => void, reject: (value: any) => void) {
    const controller = new AbortController() as AbortController;
    const signal = controller?.signal;

    const url = TelemetryUploader.postUrl(this.apiEndpoint);

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
      this.postToEndpoint(options, resolve, reject);
    });

    return promise;
  }
}
