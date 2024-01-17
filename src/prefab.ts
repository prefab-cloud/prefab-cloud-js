import { v4 as uuid } from "uuid";

import { Config } from "./config";
import ConfigValue from "./configValue";
import Context from "./context";
import { EvaluationSummaryAggregator } from "./evaluationSummaryAggregator";
import Loader from "./loader";
import { PREFIX as loggerPrefix, isValidLogLevel, Severity, shouldLog } from "./logger";
import TelemetryUploader from "./telemetryUploader";
import { LoggerAggregator } from "./loggerAggregator";
import version from "./version";

type EvaluationCallback = (key: string, value: ConfigValue, context: Context | undefined) => void;

type InitParams = {
  apiKey: string;
  context: Context;
  endpoints?: string[] | undefined;
  apiEndpoint?: string;
  timeout?: number;
  afterEvaluationCallback?: EvaluationCallback;
  collectEvaluationSummaries?: boolean;
  collectLoggerNames?: boolean;
  clientVersionString?: string;
};

type PollStatus =
  | { status: "not-started" }
  | { status: "pending" }
  | { status: "stopped" }
  | { status: "running"; frequencyInMs: number };

export class Prefab {
  private _configs: { [key: string]: Config } = {};

  private _telemetryUploader: TelemetryUploader | undefined;

  private _pollCount = 0;

  private _pollStatus: PollStatus = { status: "not-started" };

  private _pollTimeoutId = undefined as ReturnType<typeof setTimeout> | undefined;

  private _instanceHash: string = uuid();

  private collectEvaluationSummaries = false;

  private collectLoggerNames = false;

  private evalutionSummaryAggregator: EvaluationSummaryAggregator | undefined;

  private loggerAggregator: LoggerAggregator | undefined;

  public loaded = false;

  public loader: Loader | undefined;

  public afterEvaluationCallback = (() => {}) as EvaluationCallback;

  private _context: Context = new Context({});

  async init({
    apiKey,
    context: providedContext,
    endpoints = undefined,
    apiEndpoint,
    timeout = undefined,
    afterEvaluationCallback = () => {},
    collectEvaluationSummaries = false,
    collectLoggerNames = false,
    clientVersionString = `prefab-cloud-js-${version}`,
  }: InitParams) {
    const context = providedContext ?? this.context;

    if (!context) {
      throw new Error("Context must be provided");
    }

    this._context = context;

    this.loader = new Loader({
      apiKey,
      context,
      endpoints,
      timeout,
      clientVersion: clientVersionString,
    });

    this._telemetryUploader = new TelemetryUploader({
      apiKey,
      apiEndpoint,
      timeout,
      clientVersion: clientVersionString,
    });

    this.collectEvaluationSummaries = collectEvaluationSummaries;
    if (collectEvaluationSummaries) {
      this.evalutionSummaryAggregator = new EvaluationSummaryAggregator(this, 100000);
    }

    this.collectLoggerNames = collectLoggerNames;
    if (collectLoggerNames) {
      this.loggerAggregator = new LoggerAggregator(this, 100000);
    }

    this.afterEvaluationCallback = afterEvaluationCallback;

    return this.load();
  }

  get configs(): { [key: string]: Config } {
    return this._configs;
  }

  get context(): Context {
    return this._context;
  }

  get instanceHash(): string {
    return this._instanceHash;
  }

  get pollTimeoutId() {
    return this._pollTimeoutId;
  }

  get pollCount() {
    return this._pollCount;
  }

  get pollStatus() {
    return this._pollStatus;
  }

  get telemetryUploader(): TelemetryUploader | undefined {
    return this._telemetryUploader;
  }

  private async load() {
    if (!this.loader || !this.context) {
      throw new Error("Prefab not initialized. Call init() first.");
    }

    // make sure we have the freshest context
    this.loader.context = this.context;

    return this.loader
      .load()
      .then((rawValues: any) => {
        this.setConfig(rawValues);
      })
      .finally(() => {
        if (this.pollStatus.status === "running") {
          this._pollCount += 1;
        }
      });
  }

  async updateContext(context: Context, skipLoad = false) {
    if (!this.loader) {
      throw new Error("Prefab not initialized. Call init() first.");
    }

    this._context = context;

    if (skipLoad) {
      return Promise.resolve();
    }

    return this.load();
  }

  async poll({ frequencyInMs }: { frequencyInMs: number }) {
    if (!this.loader) {
      throw new Error("Prefab not initialized. Call init() first.");
    }

    this.stopPolling();

    this._pollStatus = { status: "pending" };

    return this.loader.load().finally(() => {
      this.doPolling({ frequencyInMs });
    });
  }

  private doPolling({ frequencyInMs }: { frequencyInMs: number }) {
    this._pollTimeoutId = setTimeout(() => {
      this.load().finally(() => {
        if (this.pollStatus.status === "running") {
          this.doPolling({ frequencyInMs });
        }
      });
    }, frequencyInMs);

    this._pollStatus = {
      status: "running",
      frequencyInMs,
    };
  }

  stopPolling() {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this._pollTimeoutId = undefined;
    }

    this._pollStatus = { status: "stopped" };
  }

  setConfig(rawValues: { [key: string]: any }) {
    this._configs = Config.digest(rawValues);
    this.loaded = true;
  }

  isEnabled(key: string): boolean {
    return this.get(key) === true;
  }

  get(key: string): ConfigValue {
    if (!this.loaded) {
      console.warn(
        `Prefab warning: The client has not finished loading data yet. Unable to look up actual value for key "${key}".`
      );

      return undefined;
    }

    const config = this.configs[key];

    const value = config?.value;

    if (!key.startsWith(loggerPrefix)) {
      if (this.collectEvaluationSummaries) {
        setTimeout(() => this.evalutionSummaryAggregator?.record(config));
      }

      setTimeout(() => this.afterEvaluationCallback(key, value, this.context));
    }

    return value;
  }

  shouldLog(args: Omit<Parameters<typeof shouldLog>[0], "get">): boolean {
    if (this.collectLoggerNames && isValidLogLevel(args.desiredLevel)) {
      setTimeout(
        () =>
          this.loggerAggregator?.record(
            args.loggerName,
            args.desiredLevel.toUpperCase() as Severity
          )
      );
    }

    return shouldLog({ ...args, get: this.get.bind(this) });
  }
}

export const prefab = new Prefab();
