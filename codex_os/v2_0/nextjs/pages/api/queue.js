import { TaskQueue } from "../../scalability/taskQueue";

const queue = new TaskQueue();

export default function handler(req, res) {
  const body = req.body || {};
  queue.enqueue(() => Promise.resolve({ queued: true, body }));
  res.status(200).json({
    queued: true,
    queueSize: queue.size()
  });
}
