import { WorkerPool } from "../../scalability/workerPool";

const pool = new WorkerPool(4);

export default async function handler(req, res) {
  const result = await pool.run(() => Promise.resolve("worker-ok"));
  res.status(200).json({
    worker: true,
    result
  });
}
