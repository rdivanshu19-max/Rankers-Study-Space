import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertLibraryItem } from "@shared/schema";

export function useLibraryItems(category?: string) {
  return useQuery({
    queryKey: [api.library.list.path, category],
    queryFn: async () => {
      const url = category 
        ? `${api.library.list.path}?category=${encodeURIComponent(category)}`
        : api.library.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch library items");
      return api.library.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLibraryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<InsertLibraryItem, "uploadedBy">) => {
      const res = await fetch(api.library.create.path, {
        method: api.library.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create library item");
      return api.library.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.library.list.path] });
    },
  });
}

export function useDeleteLibraryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.library.delete.path, { id });
      const res = await fetch(url, {
        method: api.library.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.library.list.path] });
    },
  });
}
