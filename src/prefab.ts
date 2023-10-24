import { v4 as uuid } from "uuid";

import { Config } from "./config";
import ConfigValue from "./configValue";
import Context from "./context";
import { EvaluationSummaryAggregator } from "./evaluationSummaryAggregator";
import Identity from "./identity";
import Loader, { LoaderParams } from "./loader";
import { PREFIX as loggerPrefix, shouldLog } from "./logger";
import TelemetryUploader from "./telemetryUploader";

type EvaluationCallback = (key: string, value: ConfigValue, context: Context | undefined) => void;

type InitParams = {
  apiKey: string;
  identity?: Identity;
  context?: Context;
  endpoints?: string[] | undefined;
  apiEndpoint?: string;
  timeout?: number;
  afterEvaluationCallback?: EvaluationCallback;
};

type PollStatus =
  | { status: "not-started" }
  | { status: "pending" }
  | { status: "stopped" }
  | { status: "running"; frequencyInMs: number };

export const prefab = {
  configs: {} as { [key: string]: Config },

  loaded: false as boolean,

  loader: undefined as Loader | undefined,

  telemetryUploader: undefined as TelemetryUploader | undefined,

  context: undefined as Context | undefined,

  loaderParams: undefined as Omit<LoaderParams, "context"> | undefined,

  pollStatus: { status: "not-started" } as PollStatus,

  pollCount: 0,

  pollTimeoutId: undefined as ReturnType<typeof setTimeout> | undefined,

  instanceHash: uuid(),

  evalutionSummaryAggregator: undefined as EvaluationSummaryAggregator | undefined,

  afterEvaluationCallback: (() => {}) as EvaluationCallback,

  async init({
    apiKey,
    context: providedContext,
    identity,
    endpoints = undefined,
    apiEndpoint,
    timeout = undefined,
    afterEvaluationCallback = () => {},
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
      apiEndpoint,
      timeout,
    });

    this.telemetryUploader = new TelemetryUploader({ apiKey, apiEndpoint, timeout });

    this.evalutionSummaryAggregator = new EvaluationSummaryAggregator(this, 100000);

    this.afterEvaluationCallback = afterEvaluationCallback;

    // eslint-disable-next-line no-use-before-define
    return load();
  },

  async poll({ frequencyInMs }: { frequencyInMs: number }) {
    if (!this.loader) {
      throw new Error("Prefab not initialized. Call init() first.");
    }

    this.stopPolling();

    this.pollStatus = { status: "pending" };

    return this.loader.load().finally(() => {
      // eslint-disable-next-line no-use-before-define
      doPolling({ frequencyInMs });
    });
  },

  stopPolling() {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = undefined;
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
    const config = this.configs[key];
    const value = config?.value;

    if (!key.startsWith(loggerPrefix)) {
      setTimeout(() => this.evalutionSummaryAggregator?.record(config));

      setTimeout(() => this.afterEvaluationCallback(key, value, this.context));
    }

    return value;
  },

  shouldLog(args: Omit<Parameters<typeof shouldLog>[0], "get">): boolean {
    return shouldLog({ ...args, get: this.get.bind(this) });
  },
};

async function load() {
  if (!prefab.loader || !prefab.context) {
    throw new Error("Prefab not initialized. Call init() first.");
  }

  // make sure we have the freshest context
  prefab.loader.context = prefab.context;

  return prefab.loader
    .load()
    .then((rawValues: any) => {
      prefab.setConfig(rawValues);
      prefab.loaded = true;
    })
    .finally(() => {
      if (prefab.pollStatus.status === "running") {
        prefab.pollCount += 1;
      }
    });
}

async function doPolling({ frequencyInMs }: { frequencyInMs: number }) {
  prefab.pollTimeoutId = setTimeout(() => {
    load().finally(() => {
      if (prefab.pollStatus.status === "running") {
        doPolling({ frequencyInMs });
      }
    });
  }, frequencyInMs);

  prefab.pollStatus = {
    status: "running",
    frequencyInMs,
  };
}
