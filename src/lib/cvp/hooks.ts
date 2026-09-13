import { useEffect, useRef, useState } from "react";
import { liveQuery } from "dexie";
import { useAppStore } from "./store";
import { canUseDb, getDb } from "./db";

/**
 * Gộp lần phát liveQuery khi IndexedDB bị ghi liên tiếp (sync bulkPut, import Excel).
 * Trên Android WebView, mỗi mutation có thể kích hoạt lại mọi subscriber cùng lúc —
 * debounce trailing giúp giảm jank; lần emit đầu vẫn chạy ngay để mở màn không trễ.
 *
 * Ví dụ:
 *   useRows(() => getDb().tasks.where("date").equals(date).toArray(), [date]);
 *   useRows(() => getDb().employees.toArray(), [], 100); // debounce 100ms
 *   useRows(() => getDb().shifts.toArray(), [], 0);      // tắt debounce
 */
export const UI_LIVE_QUERY_DEBOUNCE_MS = 50;

function useDebouncedLiveQuery<T>(
  fn: () => Promise<T> | T,
  deps: unknown[],
  initial: T,
  debounceMs: number,
): T {
  const ready = useAppStore((s) => s.ready);
  const [data, setData] = useState<T>(initial);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!ready || !canUseDb()) {
      setData(initial);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let firstEmission = true;
    let cancelled = false;

    const subscription = liveQuery(() => fnRef.current()).subscribe({
      next: (value) => {
        if (cancelled) return;
        // Lần đầu: cập nhật UI ngay. Các lần sau (storm sync): gộp theo debounceMs.
        if (firstEmission || debounceMs <= 0) {
          firstEmission = false;
          setData(value as T);
          return;
        }
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (!cancelled) setData(value as T);
        }, debounceMs);
      },
      error: (error) => {
        console.error("[cvp liveQuery]", error);
      },
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
    // Caller truyền deps ổn định (date, id, …); fn đọc qua ref để tránh re-subscribe mỗi render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional deps from caller
  }, [ready, debounceMs, ...deps]);

  return data;
}

export function useRows<T>(
  fn: () => Promise<T[]> | T[],
  deps: unknown[] = [],
  debounceMs: number = UI_LIVE_QUERY_DEBOUNCE_MS,
): T[] {
  return useDebouncedLiveQuery<T[]>(fn, deps, [], debounceMs);
}

export function useRow<T>(
  fn: () => Promise<T | undefined> | T | undefined,
  deps: unknown[] = [],
  debounceMs: number = UI_LIVE_QUERY_DEBOUNCE_MS,
): T | undefined {
  return useDebouncedLiveQuery<T | undefined>(fn, deps, undefined, debounceMs);
}

export function useCount(
  fn: () => Promise<number> | number,
  deps: unknown[] = [],
  debounceMs: number = UI_LIVE_QUERY_DEBOUNCE_MS,
): number {
  return useDebouncedLiveQuery<number>(fn, deps, 0, debounceMs);
}

export function useDbReady() {
  return useAppStore((s) => s.ready);
}

export { getDb };
