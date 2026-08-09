export class TaskQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(task) {
    this.queue.push(task);
  }

  dequeue() {
    return this.queue.shift() || null;
  }

  size() {
    return this.queue.length;
  }
}
