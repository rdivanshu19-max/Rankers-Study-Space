import { useState } from "react";
import { Layout } from "@/components/layout";
import { useLibraryItems, useCreateLibraryItem, useDeleteLibraryItem } from "@/hooks/use-library";
import { useProfile } from "@/hooks/use-profiles";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  FileText, 
  Book, 
  HelpCircle, 
  Search, 
  Plus, 
  Trash2, 
  Download,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LibraryPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useLibraryItems(categoryFilter);
  const { data: profile } = useProfile();
  const deleteItem = useDeleteLibraryItem();
  const { toast } = useToast();

  const filteredItems = items?.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (category: string) => {
    switch(category) {
      case "Book": return Book;
      case "Question Paper": return HelpCircle;
      default: return FileText;
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem.mutate(id, {
        onSuccess: () => toast({ title: "Deleted", description: "Item removed from library" }),
        onError: () => toast({ title: "Error", description: "Failed to delete item", variant: "destructive" })
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Rankers Library</h1>
            <p className="text-muted-foreground">Premium resources curated for excellence</p>
          </div>
          
          {profile?.role === 'admin' && (
            <UploadDialog />
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search materials..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select 
            value={categoryFilter || "all"} 
            onValueChange={(val) => setCategoryFilter(val === "all" ? undefined : val)}
          >
            <SelectTrigger className="w-full md:w-[200px] bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Book">Books</SelectItem>
              <SelectItem value="Lecture PDF">Lecture PDFs</SelectItem>
              <SelectItem value="Question Paper">Question Papers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
            No items found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems?.map((item) => {
              const Icon = getIcon(item.category);
              return (
                <div key={item.id} className="group bg-card rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    {profile?.role === 'admin' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">{item.category}</p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {item.description || "No description provided."}
                  </p>
                  
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-auto">
                    <Button variant="outline" className="w-full gap-2 group-hover:border-primary/50 group-hover:bg-primary/5">
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function UploadDialog() {
  const [open, setOpen] = useState(false);
  const createItem = useCreateLibraryItem();
  const { toast } = useToast();
  const [category, setCategory] = useState("Lecture PDF");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      // Note: In a real app we'd construct the URL properly based on object storage response
      // For this demo we'll use the uploadURL directly assuming it's public or we'd get a signed URL
      // But Uppy result usually gives uploadURL. Let's assume we get a valid public URL.
      const fileUrl = file.uploadURL; 

      createItem.mutate({
        title,
        description,
        category,
        fileUrl,
      }, {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Success", description: "Item added to library" });
          setTitle("");
          setDescription("");
        },
        onError: () => toast({ title: "Error", description: "Failed to add item", variant: "destructive" })
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Upload Material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload to Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Physics Chapter 1" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Book">Book</SelectItem>
                <SelectItem value="Lecture PDF">Lecture PDF</SelectItem>
                <SelectItem value="Question Paper">Question Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
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
              buttonClassName="w-full"
            >
              Select File & Upload
            </ObjectUploader>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
