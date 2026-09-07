import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/cvp/page-header";
import { TaskBadge } from "@/components/cvp/status-badge";
import { PhotoStrip } from "@/components/cvp/photo-strip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useRow, useRows } from "@/lib/cvp/hooks";
import { getDb } from "@/lib/cvp/db";
import { deleteTask, setTaskProgress, toggleChecklistItem, updateTask } from "@/lib/cvp/repo";
import { PROGRESS_STEPS } from "@/lib/cvp/progress";
import { formatDateTime } from "@/lib/cvp/time";
import { can } from "@/lib/cvp/permissions";
import { useAppStore } from "@/lib/cvp/store";
import { AbnormalDialog } from "@/components/cvp/abnormal-dialog";
import { AbnormalBadge } from "@/components/cvp/status-badge";

export const Route = createFileRoute("/tasks/$id")({ component: TaskDetail });

function TaskDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const role = useAppStore((s) => s.role);
  const task = useRow(() => getDb().tasks.get(id), [id]);
  const people = useRows(() => getDb().employees.toArray());
  const blocks = useRows(() => getDb().workBlocks.toArray());
  const logs = useRows(
    () => getDb().auditLogs.filter((l) => l.recordId === id).reverse().sortBy("timestamp"),
    [id],
  );
  const checklist = useRows(
    () => getDb().checklists.filter((c) => c.blockId === (task?.blockId ?? "")).toArray(),
    [task?.blockId],
  );
  const items = useRows(async () => {
    const ids = checklist.map((c) => c.id);
    if (!ids.length) return [];
    return getDb().checklistItems.filter((i) => ids.includes(i.checklistId) && (i.taskId === null || i.taskId === id)).toArray();
  }, [checklist, id]);
  const [note, setNote] = useState<string | null>(null);
  const [abnormalOpen, setAbnormalOpen] = useState(false);
  const abnormalities = useRows(() => getDb().abnormalities.filter((row) => row.taskId === id || (row.linkedModule === "tasks" && row.linkedId === id)).toArray(), [id]);

  if (!task) return <p className="text-muted">Không tìm thấy công việc.</p>;
  const who = people.find((p) => p.id === task.assigneeId);
  const block = blocks.find((b) => b.id === task.blockId);
  const noteVal = note ?? task.note;

  return (
    <div className="space-y-5">
      <PageHeader title={task.name} subtitle={block?.name} back="/tasks" action={<TaskBadge status={task.status} />} />
      <p className="text-sm text-muted">
        {who?.name ?? "Chưa gán"}
        {task.deadline ? ` · hạn ${formatDateTime(task.deadline)}` : ""}
      </p>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Tiến độ</h2>
          <span className="font-mono tabular-nums">{task.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={task.progress}
          className="w-full accent-primary"
          disabled={!can(role, "execute")}
          onChange={(e) => void saveProgress(Number(e.target.value))}
        />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {PROGRESS_STEPS.map((p) => (
            <Button key={p} size="sm" disabled={!can(role, "execute")} variant={task.progress === p ? "default" : "secondary"} onClick={() => void saveProgress(p)}>
              {p}%
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-medium">Bất thường</h2><p className="text-sm text-muted">{abnormalities.filter((row) => row.status !== "CLOSED").length} chưa đóng</p></div>
          {can(role, "execute") ? <Button variant="danger" size="sm" onClick={() => setAbnormalOpen(true)}>Báo bất thường</Button> : null}
        </div>
        {abnormalities.length ? <ul className="mt-3 space-y-2">{abnormalities.map((row) => <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 p-3"><span className="line-clamp-1 text-sm">{row.description}</span><AbnormalBadge status={row.status} /></li>)}</ul> : null}
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="mb-3 text-sm font-medium text-muted">Checklist</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-12 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={item.done}
                  onChange={(e) => void toggleChecklistItem(item.id, e.target.checked)}
                />
                <span className={item.done ? "text-muted line-through" : ""}>{item.label}</span>
              </label>
            </li>
          ))}
          {items.length === 0 ? <p className="text-sm text-muted">Khối này chưa có checklist.</p> : null}
        </ul>
      </section>

      <PhotoStrip ownerModule="tasks" ownerId={id} />

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">Ghi chú</h2>
        <Textarea
          value={noteVal}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== null && note !== task.note) void updateTask(id, { note });
          }}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">Lịch sử</h2>
        <ol className="space-y-2 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          {logs.map((l) => (
            <li key={l.id} className="flex gap-3 text-sm">
              <span className="w-14 shrink-0 font-mono tabular-nums text-muted">{formatDateTime(l.timestamp).split(" ")[1]}</span>
              <span>
                <span className="text-muted">{l.userName}</span> {labelAction(l.action)}
              </span>
            </li>
          ))}
          {logs.length === 0 ? <li className="text-sm text-muted">Chưa có lịch sử</li> : null}
        </ol>
      </section>

      {can(role, "manage_tasks") ? (
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (!confirm("Xóa công việc?")) return;
            await deleteTask(id);
            toast.success("Đã xóa");
            void nav({ to: "/tasks" });
          }}
        >
          Xóa công việc
        </Button>
      ) : null}
      <AbnormalDialog open={abnormalOpen} onClose={() => setAbnormalOpen(false)} linkedModule="tasks" linkedId={id} />
    </div>
  );

  async function saveProgress(progress: number) {
    try {
      await setTaskProgress(id, progress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không cập nhật được tiến độ";
      if (progress >= 100 && can(role, "manage_tasks") && message.includes("bất thường chưa đóng") && confirm(`${message}. Quản lý vẫn xác nhận hoàn thành?`)) {
        await setTaskProgress(id, progress, { allowOpenAbnormalities: true });
        toast.success("Đã hoàn thành kèm cảnh báo bất thường");
        return;
      }
      toast.error(message);
    }
  }
}

function labelAction(a: string) {
  const map: Record<string, string> = {
    CREATE: "tạo việc",
    UPDATE: "cập nhật",
    COMPLETE: "hoàn thành",
    PROGRESS: "cập nhật tiến độ",
    PHOTO: "chụp ảnh",
    DELETE: "xóa",
  };
  return map[a] ?? a;
}
