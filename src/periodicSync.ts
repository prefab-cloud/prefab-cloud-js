import {ExponentialBackoff} from './exponentialBackoff';
// import {Logger} from '...'; // Assuming the path for Logger if it exists in TypeScript

abstract class PeriodicSync<T> {
  protected data: Map<string, T> = new Map();

  private startAt: Date;

  private syncInterval: any;

  protected instanceHash: string;

  private name: string;

  constructor(instanceHash: string, name: string) {
    this.startAt = new Date();
    this.instanceHash = instanceHash;
    this.name = name;
  }

  sync(): void {
    if (this.data.size === 0) return;

    console.log(`Syncing ${this.data.size} items`);

    const startAtWas = this.startAt;
    this.startAt = new Date();

    this.flush(this.prepareData(), startAtWas);
  }

  protected abstract flush(toShip: any[], startAtWas: Date): void;

  private prepareData(): any {
    const toShip = new Map(this.data);
    this.data.clear();

    // this.onPrepareData();

    return toShip;
  }

  // protected onPrepareData(): void {
  //   // noop -- override as you wish
  // }

  post(url: string, data: any): any {
    console.log(this.instanceHash);
    console.log(url);
    console.log(data);
    // return this.client.post(url, data);
  }

  startPeriodicSync(syncInterval: any): void {
    this.startAt = new Date();
    this.syncInterval = PeriodicSync.calculateSyncInterval(syncInterval);

    // TODO: i don't think this works the same way as ruby...syncInterval is only going to get called once and so won't backoff properly
    setInterval(() => {
      console.log(`Initialized ${this.name} instance_hash=${this.instanceHash}`);
      this.sync();
    }, this.syncInterval());
  }

  private static logInternal(message: string): void {
    // this.client.log.logInternal(message, this.name, null, Logger.DEBUG);
    console.log(message);
    // TODO: pass in prefab shouldLog
  }

  // Ignoring pool method as JavaScript doesn't have the same concurrency model

  private static calculateSyncInterval(syncInterval: any): any {
    if (typeof syncInterval === 'number') {
      return () => syncInterval;
    }

    const backoff = syncInterval || new ExponentialBackoff(60 * 5);
    return () => backoff.call();
  }
}

export {PeriodicSync};
