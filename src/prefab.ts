import Config from "./config";
import ConfigValue from "./configValue";
import Context from "./context";
import Identity from "./identity";
import Loader, { LoaderParams } from "./loader";
import { shouldLog } from "./logger";

type InitParams = {
  apiKey: string;
  identity?: Identity;
  context?: Context;
  endpoints?: string[] | undefined;
  timeout?: number;
};

type PollStatus =
  | { status: "not-started" }
  | { status: "pending" }
  | { status: "stopped" }
  | {
      status: "running";
      frequencyInMs: number;
      timeoutId: ReturnType<typeof setTimeout>;
    };

export const prefab = {
  configs: {} as { [key: string]: Config },

  loaded: false as boolean,

  loader: undefined as Loader | undefined,

  context: undefined as Context | undefined,

  loaderParams: undefined as Omit<LoaderParams, "context"> | undefined,

  pollStatus: { status: "not-started" } as PollStatus,

  pollCount: 0,

  async init({
    apiKey,
    context: providedContext,
    identity,
    endpoints = undefined,
    timeout = undefined,
  }: InitParams) {
    const context = providedContext ?? identity?.toContext() ?? this.context;

    if (!context) {
      throw new Error("Context must be provided");
    }

    this.context = context;

    this.loader = new Loader({
      apiKey,
      context,
      endpoints,
      timeout,
    });

    return this.load();
  },

  async load() {
    if (!this.loader || !this.context) {
      throw new Error("Prefab not initialized. Call init() first.");
    }

    // make sure we have the freshest context
    this.loader.context = this.context;

    return this.loader
      .load()
      .then((rawValues: any) => {
        this.setConfig(rawValues);
        this.loaded = true;
      })
      .finally(() => {
        if (this.pollStatus.status === "running") {
          this.pollCount += 1;
        }
      });
  },

  async poll({ frequencyInMs }: { frequencyInMs: number }) {
    if (!this.loader) {
      throw new Error("Prefab not initialized. Call init() first.");
    }

    if (this.pollStatus.status === "running") {
      throw new Error("Already polling. Call stopPolling() first.");
    }

    this.pollStatus = { status: "pending" };

    return this.loader.load().finally(() => {
      this.doPolling({ frequencyInMs });
    });
  },

  doPolling({ frequencyInMs }: { frequencyInMs: number }) {
    const pollTimeoutId = setTimeout(() => {
      this.load().finally(() => {
        if (this.pollStatus.status === "running") {
          this.doPolling({ frequencyInMs });
        }
      });
    }, frequencyInMs);

    this.pollStatus = {
      status: "running",
      frequencyInMs,
      timeoutId: pollTimeoutId,
    };
  },

  stopPolling() {
    if (this.pollStatus.status === "running") {
      clearInterval(this.pollStatus.timeoutId);
    }

    this.pollStatus = { status: "stopped" };
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

  shouldLog(args: Omit<Parameters<typeof shouldLog>[0], "get">): boolean {
    return shouldLog({ ...args, get: this.get.bind(this) });
  },
};
