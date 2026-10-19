import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

// Dit si l'utilisateur a un abonnement actif (et jusqu'à quand)
export function useSubscription(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEndsAt(null);
      setPending(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status, ends_at")
      .eq("user_id", userId);

    if (error) console.error("Erreur chargement abonnement:", error);

    const rows = data ?? [];
    const now = Date.now();
    let best: string | null = null;
    rows.forEach((r: any) => {
      if (r.status === "active" && r.ends_at && new Date(r.ends_at).getTime() > now) {
        if (!best || new Date(r.ends_at).getTime() > new Date(best).getTime()) best = r.ends_at;
      }
    });
    setEndsAt(best);
    setPending(rows.some((r: any) => r.status === "pending"));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, active: !!endsAt, endsAt, pending, refresh };
}
