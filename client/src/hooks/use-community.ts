import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertCommunityPost, InsertCommunityReply, InsertReport } from "@shared/schema";

export function useCommunityPosts() {
  return useQuery({
    queryKey: [api.community.list.path],
    queryFn: async () => {
      const res = await fetch(api.community.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return await res.json();
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<InsertCommunityPost, "userId">) => {
      const res = await fetch(api.community.create.path, {
        method: api.community.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create post");
      return api.community.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.community.list.path] });
    },
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const url = buildUrl(api.community.reply.path, { postId });
      const res = await fetch(url, {
        method: api.community.reply.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to post reply");
      return api.community.reply.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.community.list.path] });
    },
  });
}

export function useReactToPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, emoji }: { postId: number, emoji: string }) => {
      const url = buildUrl(api.community.react.path, { postId });
      const res = await fetch(url, {
        method: api.community.react.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to react");
      return api.community.react.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.community.list.path] });
    },
  });
}

export function useReport() {
  return useMutation({
    mutationFn: async (data: Omit<InsertReport, "reportedBy">) => {
      const res = await fetch(api.community.report.path, {
        method: api.community.report.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to report content");
      return api.community.report.responses[201].parse(await res.json());
    },
  });
}
