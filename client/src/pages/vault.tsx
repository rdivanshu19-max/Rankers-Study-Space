import { useState } from "react";
import { Layout } from "@/components/layout";
import { useStudyVaultItems, useCreateVaultItem, useDeleteVaultItem } from "@/hooks/use-study-vault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Loader2,
  Lock,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VaultPage() {
  const { data: items, isLoading } = useStudyVaultItems();
  const deleteItem = useDeleteVaultItem();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (confirm("Delete this file from your vault?")) {
      deleteItem.mutate(id, {
        onSuccess: () => toast({ title: "Deleted", description: "File removed from vault" }),
      });
    }
  };

  const getDownloadUrl = (item: any) => {
    return item.linkUrl || item.fileUrl;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-600" />
              Study Vault
            </h1>
            <p className="text-muted-foreground">Secure, private storage for your notes</p>
          </div>
          <VaultUploadDialog />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items?.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Your vault is empty</h3>
            <p className="text-muted-foreground mb-6">Save links to keep them safe and organized.</p>
            <VaultUploadDialog />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items?.map((item) => {
              const downloadUrl = getDownloadUrl(item);
              const isLink = !!item.linkUrl;
              
              return (
                <div key={item.id} className="group bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-lg transition-all hover:border-emerald-500/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      {isLink ? <LinkIcon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1 truncate" title={item.title}>{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                    Added {new Date(item.createdAt!).toLocaleDateString()}
                    {isLink && <span className="text-emerald-600">(Link)</span>}
                  </p>
                  
                  {downloadUrl && (
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                        {isLink ? (
                          <>
                            <ExternalLink className="w-4 h-4" /> Open Link
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" /> Download
                          </>
                        )}
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function VaultUploadDialog() {
  const [open, setOpen] = useState(false);
  const createItem = useCreateVaultItem();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleSave = () => {
    if (!linkUrl) {
      toast({ title: "Error", description: "Please provide a link", variant: "destructive" });
      return;
    }

    const finalTitle = title || "Saved Link";

    createItem.mutate({
      title: finalTitle,
      linkUrl: linkUrl,
    }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Success", description: "Link added to vault" });
        setTitle("");
        setLinkUrl("");
      },
      onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" })
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Add Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Link to Vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Study Notes" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Link</label>
            <Input 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)} 
              placeholder="https://drive.google.com/..." 
            />
            <p className="text-xs text-muted-foreground">
              Save any link - Google Drive, Dropbox, websites, etc.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={!linkUrl}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Save to Vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
