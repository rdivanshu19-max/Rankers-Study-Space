import { useState } from "react";
import { Layout } from "@/components/layout";
import { useCommunityPosts, useCreatePost, useCreateReply, useReactToPost, useReport } from "@/hooks/use-community";
import { useProfile } from "@/hooks/use-profiles";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Heart, 
  MessageCircle, 
  Flag, 
  Send, 
  Image as ImageIcon,
  MoreHorizontal,
  ThumbsUp,
  Smile,
  Link as LinkIcon,
  Pin,
  Bell,
  ExternalLink
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { Announcement } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function CommunityPage() {
  const { data: posts, isLoading } = useCommunityPosts();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const pinnedPosts = posts?.filter((post: any) => post.isPinned) || [];
  const regularPosts = posts?.filter((post: any) => !post.isPinned) || [];
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Community</h1>
            <p className="text-muted-foreground">Discuss, share, and learn together</p>
          </div>
          {profile?.isMuted ? (
            <Button disabled className="opacity-50">
              You are muted
            </Button>
          ) : (
            <CreatePostDialog />
          )}
        </div>

        {announcements.length > 0 && (
          <div className="space-y-3">
            {announcements.slice(0, 3).map((announcement: Announcement) => (
              <div key={announcement.id} className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary">{announcement.title}</h3>
                    <p className="text-sm mt-1">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {pinnedPosts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pin className="w-4 h-4" /> Pinned Posts
                </h2>
                {pinnedPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} currentUserId={user?.id} isMuted={profile?.isMuted} />
                ))}
              </div>
            )}
            
            {regularPosts.length > 0 && (
              <div className="space-y-4">
                {pinnedPosts.length > 0 && (
                  <h2 className="text-sm font-medium text-muted-foreground">Recent Posts</h2>
                )}
                {regularPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} currentUserId={user?.id} isMuted={profile?.isMuted} />
                ))}
              </div>
            )}

            {posts?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No posts yet. Be the first to share!
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PostCard({ post, currentUserId, isMuted }: { post: any, currentUserId?: string, isMuted?: boolean }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createReply = useCreateReply();
  const reactToPost = useReactToPost();
  const reportPost = useReport();
  const { toast } = useToast();

  const handleReply = () => {
    if (isMuted) {
      toast({ title: "You are muted", description: "You cannot reply to posts.", variant: "destructive" });
      return;
    }
    createReply.mutate({ postId: post.id, content: replyContent }, {
      onSuccess: () => {
        setReplyContent("");
        setIsReplying(false);
        toast({ title: "Reply posted" });
      }
    });
  };

  const handleReaction = (emoji: string) => {
    reactToPost.mutate({ postId: post.id, emoji });
  };

  const handleReport = () => {
    reportPost.mutate({ 
      targetId: post.id, 
      targetType: 'post', 
      targetUserId: post.userId,
      reason: 'Suspicious content' 
    }, {
      onSuccess: () => toast({ title: "Reported", description: "Admin will review this content." })
    });
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (isValidUrl(part)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {part.length > 50 ? part.substring(0, 50) + '...' : part}
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`bg-card rounded-xl p-6 border shadow-sm ${post.isPinned ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`}>
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={post.author?.profilePhotoUrl || post.author?.user?.profileImageUrl} />
          <AvatarFallback>{post.author?.username?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div>
                <p className="font-semibold text-sm">{post.author?.username}</p>
                <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
              {post.isPinned && (
                <Badge variant="outline" className="border-primary text-primary text-xs">
                  <Pin className="w-3 h-3 mr-1" /> Pinned
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleReport} className="text-destructive">
                  <Flag className="w-4 h-4 mr-2" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
            {renderContentWithLinks(post.content)}
          </p>
          
          {post.linkUrl && (
            <a 
              href={post.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-3 p-3 rounded-lg border bg-muted/30 flex items-center gap-2 hover:bg-muted/50 transition-colors"
            >
              <LinkIcon className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary truncate">{post.linkUrl}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
            </a>
          )}
          
          {post.mediaUrl && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
              <img src={post.mediaUrl} alt="Post media" className="w-full object-cover max-h-96" />
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary gap-2"
              onClick={() => handleReaction('👍')}
            >
              <ThumbsUp className="w-4 h-4" /> 
              {post.reactions?.length || 0}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary gap-2"
              onClick={() => setIsReplying(!isReplying)}
              disabled={isMuted}
            >
              <MessageCircle className="w-4 h-4" />
              {post.replies?.length || 0} Replies
            </Button>
          </div>

          {isReplying && !isMuted && (
            <div className="mt-4 flex gap-2">
              <Input 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1"
              />
              <Button size="icon" onClick={handleReply} disabled={!replyContent.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {post.replies && post.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-border/50">
              {post.replies.map((reply: any) => (
                <div key={reply.id} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{reply.author?.username}</span>
                    <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-muted-foreground">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const createPost = useCreatePost();
  const { toast } = useToast();

  const handleSubmit = () => {
    createPost.mutate({ 
      content, 
      mediaUrl, 
      linkUrl: linkUrl || undefined,
      type: mediaUrl ? 'photo' : linkUrl ? 'link' : 'text' 
    }, {
      onSuccess: () => {
        setOpen(false);
        setContent("");
        setMediaUrl(undefined);
        setLinkUrl("");
        setShowLinkInput(false);
        toast({ title: "Post created" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/20">Create Post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea 
            placeholder="What's on your mind? You can include links directly in your text." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          
          {showLinkInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Link</label>
              <Input
                placeholder="https://example.com/document"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          )}
          
          {mediaUrl && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover" />
              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2"
                onClick={() => setMediaUrl(undefined)}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 gap-2">
            <div className="flex gap-2">
              <ObjectUploader
                onGetUploadParameters={async (file) => {
                  const res = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                  });
                  const { uploadURL } = await res.json();
                  return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                }}
                onComplete={(res) => {
                  if (res.successful && res.successful[0]) setMediaUrl(res.successful[0].uploadURL);
                }}
                buttonClassName="bg-transparent text-primary hover:bg-primary/10 border-0"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Photo
                </div>
              </ObjectUploader>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className={showLinkInput ? 'bg-primary/10' : ''}
              >
                <LinkIcon className="w-4 h-4 mr-2" /> Link
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!content.trim() && !mediaUrl}>Post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
