import {ExponentialBackoff} from './exponentialBackoff';
import Loader from './loader';

abstract class PeriodicSync<T> {
  protected data: Map<string, T> = new Map();

  private startAt: Date;

  private syncInterval: any;

  protected instanceHash: string;

  protected loader: Loader;

  private name: string;

  private nextSyncTimeout: NodeJS.Timeout | null = null;

  constructor(instanceHash: string, loader: Loader, name: string, syncInterval?: number) {
    this.startAt = new Date();
    this.instanceHash = instanceHash;
    this.loader = loader;
    this.name = name;

    this.startPeriodicSync(syncInterval);
  }

  sync(): void {
    if (this.data.size === 0) return;

    console.log(`Syncing ${this.data.size} items`);

    const startAtWas = this.startAt;
    this.startAt = new Date();

    this.flush(this.prepareData(), startAtWas);
  }

  protected abstract flush(toShip: Map<string, T>, startAtWas: Date): void;

  private prepareData(): Map<string, T> {
    const toShip = new Map(this.data);
    this.data.clear();

    return toShip;
  }

  private startPeriodicSync(syncInterval?: number): void {
    this.startAt = new Date();
    this.syncInterval = PeriodicSync.calculateSyncInterval(syncInterval);

    this.scheduleNextSync();
  }

  private scheduleNextSync() {
    const interval = this.syncInterval();
    console.log(
      `Scheduled next sync in ${interval} ms for ${this.name} instance_hash=${this.instanceHash}`
    );
    this.nextSyncTimeout = setTimeout(() => {
      this.sync();
      this.scheduleNextSync(); // Schedule the next sync after the current one completes
    }, interval);
  }

  private static calculateSyncInterval(syncInterval?: number): any {
    if (syncInterval !== undefined) {
      return () => syncInterval;
    }

    const backoff = new ExponentialBackoff(60 * 5);
    return () => backoff.call();
  }

  private static logInternal(message: string): void {
    // this.client.log.logInternal(message, this.name, null, Logger.DEBUG);
    console.log(message);
    // TODO: pass in prefab shouldLog
  }
}

export {PeriodicSync};
