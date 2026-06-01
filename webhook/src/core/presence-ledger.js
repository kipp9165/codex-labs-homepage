export class PresenceLedger {
  constructor({ maxEntries = 5000 } = {}) {
    this.maxEntries = maxEntries;
    this.events = new Set();
  }

  has(eventId) {
    return this.events.has(eventId);
  }

  add(eventId) {
    this.events.add(eventId);
    if (this.events.size > this.maxEntries) {
      this.events.clear();
    }
  }
}
