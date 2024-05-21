import ConfigValue from "./configValue";

export class FlagTracker {
  requestedFlags: Map<string, ConfigValue> = new Map();

  constructor() {
    window.addEventListener("popstate", this.clearFlags.bind(this));
    window.addEventListener("hashchange", this.clearFlags.bind(this));
  }

  trackFlag(key: string, value: ConfigValue) {
    console.log(`Tracking flag: ${key}`);
    this.requestedFlags.set(key, value);
  }

  getFlags(): { key: string; value: ConfigValue }[] {
    return Array.from(this.requestedFlags.entries()).map(([key, value]) => ({ key, value }));
  }

  clearFlags() {
    this.requestedFlags.clear();
  }
}
