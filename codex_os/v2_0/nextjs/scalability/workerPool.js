export class WorkerPool {
  constructor(size = 4) {
    this.size = size;
    this.queue = [];
    this.active = 0;
  }

  async run(task) {
    if (this.active >= this.size) {
      return new Promise(resolve => {
        this.queue.push(() => resolve(this.run(task)));
      });
    }

    this.active++;
    try {
      const result = await task();
      return result;
    } finally {
      this.active--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}
