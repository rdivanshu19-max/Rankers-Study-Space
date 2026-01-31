import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Users, 
  Flag, 
  MessageSquare, 
  BookOpen, 
  Ban, 
  CheckCircle, 
  XCircle,
  Trash2,
  Edit,
  Loader2
} from "lucide-react";
import type { Profile, LibraryItem, Report, CommunityPostWithAuthor } from "@shared/schema";

export default function AdminPanel() {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "" });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<CommunityPostWithAuthor[]>({
    queryKey: ["/api/community"],
  });

  const { data: libraryItems = [], isLoading: libraryLoading } = useQuery<LibraryItem[]>({
    queryKey: ["/api/library"],
  });

  const banUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/users/${userId}/ban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User banned successfully" });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/users/${userId}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User unbanned successfully" });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("POST", `/api/admin/reports/${id}/resolve`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Report updated" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/community/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      toast({ title: "Post deleted" });
    },
  });

  const deleteLibraryItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/library/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      toast({ title: "Library item deleted" });
    },
  });

  const updateLibraryItemMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; title?: string; description?: string; category?: string }) =>
      apiRequest("PUT", `/api/library/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      setEditingItem(null);
      toast({ title: "Library item updated" });
    },
  });

  const handleEdit = (item: LibraryItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || "",
      category: item.category,
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    updateLibraryItemMutation.mutate({
      id: editingItem.id,
      title: editForm.title,
      description: editForm.description,
      category: editForm.category,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="users" data-testid="tab-users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="community" data-testid="tab-community" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="library" data-testid="tab-library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No users found</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((profile: any) => (
                      <div
                        key={profile.id}
                        data-testid={`user-row-${profile.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium">
                              {profile.username?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{profile.username || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.user?.email || "No email"}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                              {profile.role}
                            </Badge>
                            {profile.isBanned && (
                              <Badge variant="destructive">Banned</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {profile.isBanned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-unban-${profile.id}`}
                              onClick={() => unbanUserMutation.mutate(profile.userId)}
                              disabled={unbanUserMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              data-testid={`button-ban-${profile.id}`}
                              onClick={() => banUserMutation.mutate(profile.userId)}
                              disabled={banUserMutation.isPending || profile.role === "admin"}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Reports ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reports found</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        data-testid={`report-row-${report.id}`}
                        className="p-4 rounded-lg border bg-card space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{report.targetType}</Badge>
                              <Badge
                                variant={
                                  report.status === "pending"
                                    ? "secondary"
                                    : report.status === "resolved"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {report.status}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm">{report.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Target ID: {report.targetId}
                            </p>
                          </div>
                          {report.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                data-testid={`button-resolve-${report.id}`}
                                onClick={() =>
                                  resolveReportMutation.mutate({ id: report.id, status: "resolved" })
                                }
                                disabled={resolveReportMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-dismiss-${report.id}`}
                                onClick={() =>
                                  resolveReportMutation.mutate({ id: report.id, status: "dismissed" })
                                }
                                disabled={resolveReportMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Community Posts ({posts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : posts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No posts found</p>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        data-testid={`post-row-${post.id}`}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {post.author?.username || "Unknown User"}
                            </p>
                            <p className="mt-1 text-sm line-clamp-2">{post.content}</p>
                            {post.mediaUrl && (
                              <Badge variant="outline" className="mt-2">
                                Has Media
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Replies: {post.replies?.length || 0}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            data-testid={`button-delete-post-${post.id}`}
                            onClick={() => deletePostMutation.mutate(post.id)}
                            disabled={deletePostMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Library Items ({libraryItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {libraryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : libraryItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No library items found</p>
                ) : (
                  <div className="space-y-3">
                    {libraryItems.map((item) => (
                      <div
                        key={item.id}
                        data-testid={`library-row-${item.id}`}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{item.title}</h4>
                              <Badge variant="secondary">{item.category}</Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-edit-library-${item.id}`}
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Library Item</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                      data-testid="input-edit-title"
                                      value={editForm.title}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, title: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                      data-testid="input-edit-description"
                                      value={editForm.description}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, description: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <Select
                                      value={editForm.category}
                                      onValueChange={(value) =>
                                        setEditForm({ ...editForm, category: value })
                                      }
                                    >
                                      <SelectTrigger data-testid="select-edit-category">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Book">Book</SelectItem>
                                        <SelectItem value="Lecture PDF">Lecture PDF</SelectItem>
                                        <SelectItem value="Question Paper">Question Paper</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    data-testid="button-save-edit"
                                    className="w-full"
                                    onClick={handleSaveEdit}
                                    disabled={updateLibraryItemMutation.isPending}
                                  >
                                    {updateLibraryItemMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Save Changes
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="destructive"
                              data-testid={`button-delete-library-${item.id}`}
                              onClick={() => deleteLibraryItemMutation.mutate(item.id)}
                              disabled={deleteLibraryItemMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
