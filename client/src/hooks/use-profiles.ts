import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertProfile } from "@shared/schema";
import { useAuth } from "./use-auth";

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.me.responses[200].parse(await res.json());
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<InsertProfile>) => {
      const res = await fetch(api.profiles.update.path, {
        method: api.profiles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update profile");
      return api.profiles.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}

export function useVerifyAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (passcode: string) => {
      const res = await fetch(api.profiles.verifyAdmin.path, {
        method: api.profiles.verifyAdmin.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 403) throw new Error("Invalid passcode");
        throw new Error("Verification failed");
      }
      return api.profiles.verifyAdmin.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}
