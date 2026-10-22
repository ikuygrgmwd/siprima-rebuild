"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Snapshot } from "@/lib/domain";
import { repository } from "@/lib/repository";

type Context = {
  data: Snapshot | null;
  error: string;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  run: <T>(task: () => Promise<T>, message?: string) => Promise<T>;
};
const DemoContext = createContext<Context | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(async () => {
    try {
      const next = await repository.snapshot();
      setData(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Data gagal dimuat.");
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    repository
      .snapshot()
      .then((next) => {
        if (mounted) {
          setData(next);
          setError("");
        }
      })
      .catch((e) => {
        if (mounted)
          setError(e instanceof Error ? e.message : "Data gagal dimuat.");
      });
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("siprima-update");
      channel.current.onmessage = () => void refresh();
    }
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      mounted = false;
      window.removeEventListener("focus", focus);
      channel.current?.close();
    };
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function run<T>(task: () => Promise<T>, message?: string): Promise<T> {
    const result = await task();
    await refresh();
    channel.current?.postMessage("updated");
    if (message) setToast(message);
    return result;
  }
  return (
    <DemoContext.Provider
      value={{ data, error, refresh, notify: setToast, run }}
    >
      {children}
      {toast && (
        <div role="status" className="toast">
          <span>✓</span>
          {toast}
          <button aria-label="Tutup notifikasi" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("DemoProvider diperlukan.");
  return ctx;
}
