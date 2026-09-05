import { createHashHistory, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const history =
    typeof window !== "undefined" && import.meta.env.VITE_PWA_HASH_ROUTING === "1"
      ? createHashHistory()
      : undefined;
  return createRouter({ routeTree, defaultErrorComponent: AppErrorComponent, history });
}
