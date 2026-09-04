// Pure planning keeps deadline edits, completion and cancellation testable without Android.
export interface ReminderTask {
  id: string; name: string; status: string; deadline: number | null; reminderTime: number | null;
}
export function planTaskReminders(tasks: ReminderTask[], now: number) {
  return tasks.flatMap((task) => {
    if (task.status === "COMPLETED" || task.deadline === null || !Number.isFinite(task.deadline)) return [];
    const deadline = task.deadline;
    const events = [
      { kind: "before", at: task.reminderTime ?? deadline - 30 * 60_000, title: "Công việc sắp đến hạn" },
      { kind: "due", at: deadline, title: "Công việc đến hạn" },
    ];
    return events.filter((event) => Number.isFinite(event.at) && event.at > now && event.at <= deadline)
      .map((event) => ({ key: `${task.id}:${event.kind}`, recordId: task.id, body: task.name, ...event }));
  }).sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
}
