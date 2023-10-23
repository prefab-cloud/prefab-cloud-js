import { ExponentialBackoff } from "./exponentialBackoff";
import { type prefab } from "./prefab";

abstract class PeriodicSync<T> {
  protected data: Map<string, T> = new Map();

  private startAt: Date;

  private syncInterval: any;

  protected client: typeof prefab;

  private name: string;

  // private nextSyncTimeout: NodeJS.Timeout | null = null;

  constructor(client: typeof prefab, name: string, syncInterval?: number) {
    this.client = client;
    this.name = name;

    this.startAt = new Date();

    this.startPeriodicSync(syncInterval);
  }

  sync(): void {
    if (this.data.size === 0) return;

    this.logInternal(`Syncing ${this.data.size} items`);

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
    this.logInternal(
      `Scheduled next sync in ${interval} ms for ${this.name} instanceHash=${this.client.instanceHash}`
    );
    setTimeout(() => {
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

  protected logInternal(message: string): void {
    if (
      this.client.shouldLog({ loggerName: this.name, desiredLevel: "debug", defaultLevel: "error" })
    ) {
      console.log(message);
    }
  }
}

export { PeriodicSync };
