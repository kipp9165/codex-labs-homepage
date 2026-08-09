export async function jobRunner(queue, workerPool) {
  const task = queue.dequeue();
  if (!task) return { executed: false };

  const result = await workerPool.run(task);
  return { executed: true, result };
}
