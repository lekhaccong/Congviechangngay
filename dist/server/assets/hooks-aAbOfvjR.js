import { m as canUseDb, t as useAppStore } from "./store-Crr6urgA.js";
import { useLiveQuery } from "dexie-react-hooks";
//#region src/lib/cvp/hooks.ts
function useRows(fn, deps = []) {
	const ready = useAppStore((s) => s.ready);
	return useLiveQuery(() => {
		if (!ready || !canUseDb()) return [];
		return fn();
	}, [ready, ...deps]) ?? [];
}
function useRow(fn, deps = []) {
	const ready = useAppStore((s) => s.ready);
	return useLiveQuery(() => {
		if (!ready || !canUseDb()) return void 0;
		return fn();
	}, [ready, ...deps]);
}
//#endregion
export { useRows as n, useRow as t };
