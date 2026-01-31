import { useState } from "react";
import { Layout } from "@/components/layout";
import { useStudyVaultItems, useCreateVaultItem, useDeleteVaultItem } from "@/hooks/use-study-vault";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Download,
  Loader2,
  Lock
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
            <p className="text-muted-foreground mb-6">Upload your personal study materials to keep them safe.</p>
            <VaultUploadDialog />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items?.map((item) => (
              <div key={item.id} className="group bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-lg transition-all hover:border-emerald-500/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <h3 className="font-bold text-lg mb-1 truncate" title={item.title}>{item.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Added {new Date(item.createdAt!).toLocaleDateString()}
                </p>
                
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200">
                    <Download className="w-4 h-4" /> Download
                  </Button>
                </a>
              </div>
            ))}
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

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      // Use filename as title if not provided
      const finalTitle = title || file.name;
      const fileUrl = file.uploadURL; 

      createItem.mutate({
        title: finalTitle,
        fileUrl,
      }, {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Success", description: "File added to vault" });
          setTitle("");
        },
        onError: () => toast({ title: "Error", description: "Failed to upload", variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Add to Vault
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Secure Upload</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title (Optional)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Secret Notes" />
          </div>
          
          <div className="pt-2">
            <ObjectUploader
              onGetUploadParameters={async (file) => {
                const res = await fetch("/api/uploads/request-url", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: file.name,
                    size: file.size,
                    contentType: file.type,
                  }),
                });
                const { uploadURL } = await res.json();
                return {
                  method: "PUT",
                  url: uploadURL,
                  headers: { "Content-Type": file.type },
                };
              }}
              onComplete={handleUploadComplete}
              buttonClassName="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Select & Encrypt File
            </ObjectUploader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
