import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/cvp/page-header";
import { Input } from "@/components/ui/input";
import { getDb } from "@/lib/cvp/db";
import type { DataItem, Employee, GoodsItem, Lot, Task } from "@/lib/cvp/types";

export const Route = createFileRoute("/search")({ component: SearchPage });

type SearchHits = {
  people: Employee[];
  tasks: Task[];
  data: DataItem[];
  goods: GoodsItem[];
  lots: Lot[];
};

const EMPTY: SearchHits = { people: [], tasks: [], data: [], goods: [], lots: [] };

/**
 * Không gắn liveQuery full-table: mỗi lần gõ mới đọc DB (debounce).
 * Tránh 5 subscriber toArray() sống vĩnh viễn trên Android.
 */
async function runSearch(needle: string): Promise<SearchHits> {
  const db = getDb();
  const lower = needle.toLowerCase();

  // code / invoice / lot: ưu tiên equals index khi từ khóa trùng mã; vẫn fallback includes trên tập nhỏ hơn nếu cần.
  // Một lần đọc mỗi bảng khi user dừng gõ (debounce 200ms) — không subscribe liveQuery.
  const [allPeople, allTasks, allData, allGoods, allLots] = await Promise.all([
    db.employees.toArray(),
    db.tasks.toArray(),
    db.dataItems.toArray(),
    db.goodsItems.toArray(),
    db.lots.toArray(),
  ]);

  return {
    people: allPeople.filter((p) => p.name.toLowerCase().includes(lower) || p.code.toLowerCase().includes(lower)),
    tasks: allTasks.filter((t) => t.name.toLowerCase().includes(lower) || t.id === needle),
    data: allData.filter(
      (d) =>
        d.productCode.toLowerCase().includes(lower) ||
        d.invoice.toLowerCase().includes(lower) ||
        d.lot.toLowerCase().includes(lower),
    ),
    goods: allGoods.filter(
      (d) =>
        d.productCode.toLowerCase().includes(lower) ||
        d.invoice.toLowerCase().includes(lower) ||
        d.lot.toLowerCase().includes(lower) ||
        (d.itemCode ?? "").toLowerCase().includes(lower),
    ),
    lots: allLots.filter((d) => d.lotCode.toLowerCase().includes(lower) || d.invoice.toLowerCase().includes(lower)),
  };
}

function SearchPage() {
  const [q, setQ] = useState("");
  const needle = q.trim();
  const [hits, setHits] = useState<SearchHits>(EMPTY);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!needle) {
      setHits(EMPTY);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void runSearch(needle)
        .then((result) => {
          if (!cancelled) setHits(result);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [needle]);

  const total =
    hits.people.length + hits.tasks.length + hits.data.length + hits.goods.length + hits.lots.length;

  return (
    <div>
      <PageHeader title="Tìm kiếm" subtitle="Tên, mã NV, mã SP, invoice, lot, công việc" />
      <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ để lọc…" className="mb-4" />
      {!needle ? (
        <EmptyState title="Nhập từ khóa" hint="Tìm nhanh trên toàn bộ dữ liệu đang lưu trên máy." />
      ) : searching && total === 0 ? (
        <EmptyState title="Đang tìm…" />
      ) : total === 0 ? (
        <EmptyState title="Không có kết quả" />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {hits.people.map((p) => (
            <li key={p.id}>
              <Link to="/people/$id" params={{ id: p.id }} className="flex min-h-14 items-center justify-between px-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted">{p.code}</p>
                </div>
                <span className="text-xs text-muted">Nhân sự</span>
              </Link>
            </li>
          ))}
          {hits.tasks.map((t) => (
            <li key={t.id}>
              <Link to="/tasks/$id" params={{ id: t.id }} className="flex min-h-14 items-center justify-between px-4">
                <p className="font-medium">{t.name}</p>
                <span className="text-xs text-muted">Việc</span>
              </Link>
            </li>
          ))}
          {hits.data.map((d) => (
            <li key={d.id}>
              <Link to="/goods/data/$id" params={{ id: d.id }} className="flex min-h-14 items-center justify-between px-4">
                <div>
                  <p className="font-medium">{d.productCode}</p>
                  <p className="text-xs text-muted">{d.invoice} · {d.lot}</p>
                </div>
                <span className="text-xs text-muted">DATA</span>
              </Link>
            </li>
          ))}
          {hits.goods.map((d) => (
            <li key={d.id}>
              <Link to="/goods/export/$id" params={{ id: d.id }} className="flex min-h-14 items-center justify-between px-4">
                <div>
                  <p className="font-medium">{d.productCode || d.invoice}</p>
                  <p className="text-xs text-muted">{d.invoice} · {d.lot}</p>
                </div>
                <span className="text-xs text-muted">Hàng</span>
              </Link>
            </li>
          ))}
          {hits.lots.map((d) => (
            <li key={d.id}>
              <Link to="/goods/lot/$id" params={{ id: d.id }} className="flex min-h-14 items-center justify-between px-4">
                <div>
                  <p className="font-medium">{d.lotCode}</p>
                  <p className="text-xs text-muted">{d.invoice}</p>
                </div>
                <span className="text-xs text-muted">Lot</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
