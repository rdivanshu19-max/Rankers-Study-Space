import { useState } from "react";
import { Layout } from "@/components/layout";
import { useStudyVaultItems, useCreateVaultItem, useDeleteVaultItem } from "@/hooks/use-study-vault";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Download,
  Loader2,
  Lock,
  Link as LinkIcon,
  ExternalLink,
  Upload
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
            <p className="text-muted-foreground mb-6">Upload files or save links to keep them safe.</p>
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
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [fileUrl, setFileUrl] = useState("");

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      setFileUrl(file.uploadURL);
      if (!title) setTitle(file.name);
      toast({ title: "File uploaded", description: "Now save to vault." });
    }
  };

  const handleSave = () => {
    const url = uploadMode === "link" ? linkUrl : fileUrl;
    if (!url) {
      toast({ title: "Error", description: "Please provide a file or link", variant: "destructive" });
      return;
    }

    const finalTitle = title || (uploadMode === "link" ? "Saved Link" : "Uploaded File");

    createItem.mutate({
      title: finalTitle,
      fileUrl: uploadMode === "file" ? fileUrl : undefined,
      linkUrl: uploadMode === "link" ? linkUrl : undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Success", description: "Item added to vault" });
        setTitle("");
        setLinkUrl("");
        setFileUrl("");
      },
      onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" })
    });
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
          <DialogTitle>Add to Vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Study Notes" />
          </div>
          
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "link")}>
            <TabsList className="w-full">
              <TabsTrigger value="file" className="flex-1">
                <Upload className="w-4 h-4 mr-2" /> Upload File
              </TabsTrigger>
              <TabsTrigger value="link" className="flex-1">
                <LinkIcon className="w-4 h-4 mr-2" /> Save Link
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {uploadMode === "file" ? (
            <div className="pt-2">
              {fileUrl ? (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">File uploaded successfully!</p>
                </div>
              ) : (
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
                  Select & Upload File
                </ObjectUploader>
              )}
            </div>
          ) : (
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
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={uploadMode === "file" ? !fileUrl : !linkUrl}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Save to Vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
