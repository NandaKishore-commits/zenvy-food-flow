import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Returns whether the current user has the given role. */
export function useHasRole(role: "admin" | "user") {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setHasRole(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: role })
      .then(({ data }) => {
        if (!cancelled) setHasRole(Boolean(data));
      });
    return () => {
      cancelled = true;
    };
  }, [user, role]);

  return hasRole;
}