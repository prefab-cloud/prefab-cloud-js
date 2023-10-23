// initialize triggers to flush on beforeunload

// retries

// pause when offline?

// flush when we receive a config update (or as a result of a context update...but that should trigger a config update anyway)

// client option to disable telemetry?

import {PeriodicSync} from './periodicSync';
import {Config, ConfigEvaluationMetadata} from './config';
import {type prefab} from './prefab';

type ConfigEvaluationCounter = Omit<ConfigEvaluationMetadata, 'type'> & {
  count: number;
};

type ConfigEvaluationSummary = {
  key: string;
  type: string; // should this be restricted type enum?
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
  instance_hash: string;
  events: TelemetryEvent[];
};

class EvaluationSummaryAggregator extends PeriodicSync<ConfigEvaluationCounter> {
  private maxKeys: number;

  constructor(client: typeof prefab, maxKeys: number, syncInterval?: number) {
    super(client, 'evaluation_summary_aggregator', syncInterval);

    this.maxKeys = maxKeys;
  }

  record(config: Config): void {
    if (this.data.size >= this.maxKeys) return;

    const {type, ...metadata} = config.configEvaluationMetadata;
    const key = `${config.key},${type}`;

    // create counter entry if it doesn't exist
    if (!this.data.has(key)) {
      // TODO: add rule match metadata from config
      this.data.set(key, {...metadata, count: 0});
    }

    // increment count
    const counter = this.data.get(key);
    if (counter) {
      counter.count += 1;
    }
  }

  protected flush(toShip: Map<string, ConfigEvaluationCounter>, startAtWas: Date): void {
    this.logInternal(`Flushing ${toShip.size} summaries`);

    const summaries = {
      start: startAtWas.getTime(),
      end: new Date().getTime(),
      summaries: EvaluationSummaryAggregator.summaries(toShip),
    };

    this.client.loader?.post({telemetryEvents: this.events(summaries)});
    // TODO: log result of post?
    // PeriodicSync.logInternal(`Uploaded ${toShip.length} summaries: ${result.status}`);
  }

  private static summaries(data: Map<string, ConfigEvaluationCounter>): ConfigEvaluationSummary[] {
    return Array.from(data).map((entry: [string, ConfigEvaluationCounter]) => {
      const [configKey, configType] = entry[0].split(',');
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
    const event = {summaries};

    return {
      instance_hash: this.client.instanceHash,
      events: [event],
    };
  }
}

export {EvaluationSummaryAggregator};
