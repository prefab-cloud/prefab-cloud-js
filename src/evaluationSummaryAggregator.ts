// TODO: flush on beforeunload

// TODO: should we retry the data chunk if a flush fails?

// TODO: pause when offline?

// TODO: flush when we receive a config update (or as a result of a context update...but that should trigger a config update anyway)

import { PeriodicSync } from "./periodicSync";
import { Config, ConfigEvaluationMetadata } from "./config";
import { type prefab } from "./prefab";

type ConfigEvaluationCounter = Omit<ConfigEvaluationMetadata, "type"> & {
  selectedValue: any;
  count: number;
};

type ConfigEvaluationSummary = {
  key: string;
  type: string; // FEATURE_FLAG, CONFIG, etc
  counters: ConfigEvaluationCounter[];
};

type ConfigEvaluationSummaries = {
  start: number;
  end: number;
  summaries: ConfigEvaluationSummary[];
};

type TelemetryEvent = {
  summaries: ConfigEvaluationSummaries[];
};

type TelemetryEvents = {
  instanceHash: string;
  events: TelemetryEvent[];
};

class EvaluationSummaryAggregator extends PeriodicSync<ConfigEvaluationCounter> {
  private maxKeys: number;

  constructor(client: typeof prefab, maxKeys: number, syncInterval?: number) {
    super(client, "EvaluationSummaryAggregator", syncInterval);

    this.maxKeys = maxKeys;
  }

  record(config: Config): void {
    if (this.data.size >= this.maxKeys) return;

    if (config?.configEvaluationMetadata) {
      const { type, ...metadata } = config.configEvaluationMetadata;
      const key = `${config.key},${type}`;

      // create counter entry if it doesn't exist
      if (!this.data.has(key)) {
        this.data.set(key, {
          ...metadata,
          selectedValue: { [config.type]: config.value },
          count: 0,
        });
      }

      // increment count
      const counter = this.data.get(key);
      if (counter) {
        counter.count += 1;
      }
    }
  }

  protected flush(toShip: Map<string, ConfigEvaluationCounter>, startAtWas: Date): void {
    this.logInternal(`Flushing ${toShip.size} summaries`);

    const summaries = {
      start: startAtWas.getTime(),
      end: new Date().getTime(),
      summaries: EvaluationSummaryAggregator.summaries(toShip),
    };

    this.client.telemetryUploader?.post(this.events(summaries)).then(() => {
      this.logInternal(`Uploaded ${toShip.size} summaries`);
    });
  }

  private static summaries(data: Map<string, ConfigEvaluationCounter>): ConfigEvaluationSummary[] {
    return Array.from(data).map((entry: [string, ConfigEvaluationCounter]) => {
      const [configKey, configType] = entry[0].split(",");
      const counter = entry[1];
      const counters = [counter]; // this client only ever has one set of counter info per key

      return {
        key: configKey,
        type: configType,
        counters,
      };
    });
  }

  private events(summaries: any): TelemetryEvents {
    const event = { summaries };

    return {
      instanceHash: this.client.instanceHash,
      events: [event],
    };
  }
}

export { EvaluationSummaryAggregator };
