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
import Loader from './loader';

type ConfigEvaluationCounter = {
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
  instance_hash: string; // other type?
  events: TelemetryEvent[];
};

class EvaluationSummaryAggregator extends PeriodicSync<ConfigEvaluationCounter> {
  private maxKeys: number;

  constructor(instanceHash: string, loader: Loader, maxKeys: number, syncInterval?: number) {
    super(instanceHash, loader, 'evaluation_summary_aggregator', syncInterval);

    this.maxKeys = maxKeys;

    console.log('Constructing evaluation summary aggregator');
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

  protected flush(toShip: Map<string, ConfigEvaluationCounter>, startAtWas: Date): void {
    // Not sure about threading in TS for this, so ignoring for now
    console.log(`Flushing ${toShip.size} summaries`);

    const summariesProto = {
      start: startAtWas.getTime(),
      end: new Date().getTime(),
      summaries: EvaluationSummaryAggregator.summaries(toShip),
    };

    this.loader.post(this.events(summariesProto));
    // console.log(`Uploaded ${toShip.length} summaries: ${result.status}`);
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

  private static summaries(data: Map<string, ConfigEvaluationCounter>): ConfigEvaluationSummary[] {
    return Array.from(data).map((entry: [string, ConfigEvaluationCounter]) => {
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
