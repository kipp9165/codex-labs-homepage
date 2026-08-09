import { shardKey } from "./shardKey";
import { WorkerPool } from "./workerPool";
import { TaskQueue } from "./taskQueue";
import { jobRunner } from "./jobRunner";

export async function scalabilityTest() {
  const queue = new TaskQueue();
  const pool = new WorkerPool(4);

  queue.enqueue(() => Promise.resolve("task-1-ok"));
  queue.enqueue(() => Promise.resolve("task-2-ok"));

  const r1 = await jobRunner(queue, pool);
  const r2 = await jobRunner(queue, pool);

  const shard = shardKey("/test", { test: true });

  return {
    shard,
    r1,
    r2,
    queueSize: queue.size()
  };
}
