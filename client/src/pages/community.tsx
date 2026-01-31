import { useState } from "react";
import { Layout } from "@/components/layout";
import { useCommunityPosts, useCreatePost, useCreateReply, useReactToPost, useReport } from "@/hooks/use-community";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Smile
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function CommunityPage() {
  const { data: posts, isLoading } = useCommunityPosts();
  const { data: profile } = useProfile();
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Community</h1>
            <p className="text-muted-foreground">Discuss, share, and learn together</p>
          </div>
          <CreatePostDialog />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {posts?.map((post: any) => (
              <PostCard key={post.id} post={post} currentUserId={profile?.user?.id} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PostCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createReply = useCreateReply();
  const reactToPost = useReactToPost();
  const reportPost = useReport();
  const { toast } = useToast();

  const handleReply = () => {
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
      reason: 'Suspicious content' 
    }, {
      onSuccess: () => toast({ title: "Reported", description: "Admin will review this content." })
    });
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={post.author?.user?.profileImageUrl} />
          <AvatarFallback>{post.author?.username?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{post.author?.username}</p>
              <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
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

          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          
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
            >
              <MessageCircle className="w-4 h-4" />
              {post.replies?.length || 0} Replies
            </Button>
          </div>

          {isReplying && (
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
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const createPost = useCreatePost();
  const { toast } = useToast();

  const handleSubmit = () => {
    createPost.mutate({ content, mediaUrl, type: mediaUrl ? 'photo' : 'text' }, {
      onSuccess: () => {
        setOpen(false);
        setContent("");
        setMediaUrl(undefined);
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
            placeholder="What's on your mind?" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          
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

          <div className="flex items-center justify-between pt-2">
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
                if (res.successful[0]) setMediaUrl(res.successful[0].uploadURL);
              }}
              buttonClassName="bg-transparent text-primary hover:bg-primary/10 border-0"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Add Photo
              </div>
            </ObjectUploader>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!content.trim() && !mediaUrl}>Post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
