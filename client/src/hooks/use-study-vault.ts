import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertStudyVaultItem } from "@shared/schema";

export function useStudyVaultItems() {
  return useQuery({
    queryKey: [api.studyVault.list.path],
    queryFn: async () => {
      const res = await fetch(api.studyVault.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vault items");
      return api.studyVault.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVaultItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<InsertStudyVaultItem, "userId">) => {
      const res = await fetch(api.studyVault.create.path, {
        method: api.studyVault.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to upload vault item");
      return api.studyVault.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.studyVault.list.path] });
    },
  });
}

export function useDeleteVaultItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.studyVault.delete.path, { id });
      const res = await fetch(url, {
        method: api.studyVault.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.studyVault.list.path] });
    },
  });
}
