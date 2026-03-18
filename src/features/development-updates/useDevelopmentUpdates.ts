import { useState, useEffect } from "react";
import type { DevelopmentUpdate } from "./types";
import { getDevelopmentUpdates } from "./api";

export function useDevelopmentUpdates() {
  const [updates, setUpdates] = useState<DevelopmentUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getDevelopmentUpdates().then((data) => {
      if (!cancelled) {
        setUpdates(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  return { updates, loading };
}
