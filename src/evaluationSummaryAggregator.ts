// initialize temporary store

// initialize timer for flushing

// initialize triggers to flush on unload, etc

// method to record eval

// internal method to send evals to endpoint

// exponential backoff

// retries

// flush when we receive a config update (or as a result of a context update...but that should trigger a config update anyway)

import {PeriodicSync} from './periodicSync';
import Config from './config';

type ConfigEvaluationCounter = {
  count: number;
};

type ConfigEvaluationSummary = {
  key: string;
  type: string; // should this be restricted type enum?
  counters: ConfigEvaluationCounter[];
};

type ConfigEvaluationSummaries = {
  start: Date;
  end: Date;
  summaries: ConfigEvaluationSummary[];
};

type TelemetryEvent = {
  summaries: ConfigEvaluationSummaries[];
};

type TelemetryEvents = {
  instance_hash: string; // other type?
  events: TelemetryEvent[];
};

class EvaluationSummaryAggregator extends PeriodicSync<ConfigEvaluationCounter> {
  private maxKeys: number;

  constructor(instanceHash: string, maxKeys: number, syncInterval?: number) {
    super(instanceHash, 'evaluation_summary_aggregator');

    this.maxKeys = maxKeys;
    this.startPeriodicSync(syncInterval);
  }

  record(config: Config): void {
    if (this.data.size >= this.maxKeys) return;

    const key = `${config.key},${config.type}`;

    // create counter entry if it doesn't exist
    if (!this.data.has(key)) {
      this.data.set(key, {count: 0});
    }

    // increment count
    const counter = this.data.get(key);
    if (counter) {
      counter.count += 1;
    }
  }

  protected flush(toShip: any[], startAtWas: Date): void {
    // Not sure about threading in TS for this, so ignoring for now
    console.log(`Flushing ${toShip.length} summaries`);

    const summariesProto = {
      start: startAtWas,
      end: new Date(), // Assuming this replaces Prefab::TimeHelpers.now_in_ms
      summaries: EvaluationSummaryAggregator.summaries(toShip),
    };

    const result = this.post('/api/v1/telemetry', this.events(summariesProto));
    console.log(`Uploaded ${toShip.length} summaries: ${result.status}`);
  }

  // private counterProto(counter: any, count: number): ConfigEvaluationCounter {
  //   return new ConfigEvaluationCounter({
  //     config_id: counter.config_id,
  //     selected_index: counter.selected_index,
  //     config_row_index: counter.config_row_index,
  //     conditional_value_index: counter.conditional_value_index,
  //     weighted_value_index: counter.weighted_value_index,
  //     selected_value: counter.selected_value,
  //     count: count,
  //   });
  // }

  private static summaries(data: any): ConfigEvaluationSummary[] {
    return data.map((entry: [string, Map<string, number>]) => {
      const [configKey, configType] = entry[0].split(',');
      const counter = entry[1];
      const counterProtos = [counter];
      // const counterProtos = Array.from(counters.entries()).map(([counter, count]) =>
      //   this.counterProto(counter, count)
      // );

      return {
        key: configKey,
        type: configType,
        counters: counterProtos,
      };
    });
  }

  private events(summaries: any): TelemetryEvents {
    const event = {summaries};

    return {
      instance_hash: this.instanceHash,
      events: [event],
    };
  }
}

export {EvaluationSummaryAggregator};
