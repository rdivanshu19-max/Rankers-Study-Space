import { useState } from "react";
import { useProfile, useUpdateProfile, useVerifyAdmin } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Settings } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";

export default function Profile() {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const verifyAdmin = useVerifyAdmin();
  const { toast } = useToast();
  
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [passcode, setPasscode] = useState("");

  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: profile?.username || "",
      bio: profile?.bio || "",
    }
  });

  if (isLoading || !profile) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const onSave = (data: any) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast({ title: "Profile updated", description: "Your changes have been saved." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
      }
    });
  };

  const handleAdminVerify = () => {
    verifyAdmin.mutate(passcode, {
      onSuccess: () => {
        setIsAdminDialogOpen(false);
        setPasscode("");
        toast({ title: "Access Granted", description: "You are now an Admin." });
      },
      onError: (err) => {
        toast({ title: "Access Denied", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and settings</p>
        </div>

        <div className="grid gap-8">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-6 pb-2">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">{profile.username?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{profile.username || 'Student'}</CardTitle>
                <CardDescription className="text-base capitalize flex items-center gap-2 mt-1">
                  {profile.role}
                  {profile.role === 'admin' && <ShieldAlert className="w-4 h-4 text-primary" />}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSave)} className="space-y-6">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nickname</label>
                  <Input {...register("username")} placeholder="Enter your nickname" />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea {...register("bio")} placeholder="Tell us about yourself..." className="h-24 resize-none" />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg">Admin Access</CardTitle>
              <CardDescription>
                Administrative privileges are restricted to authorized personnel only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.role === 'admin' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button disabled variant="outline" className="sm:w-auto bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    You have Admin privileges
                  </Button>
                  <Link href="/admin">
                    <Button data-testid="button-open-admin-panel" className="w-full sm:w-auto">
                      <Settings className="w-4 h-4 mr-2" />
                      Open Admin Panel
                    </Button>
                  </Link>
                </div>
              ) : (
                <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto border-accent/30 hover:bg-accent/10 hover:text-accent">
                      Switch to Admin Mode
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Admin Verification</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Please enter the secure passcode to verify your identity.
                      </p>
                      <Input 
                        type="password" 
                        placeholder="Enter passcode" 
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAdminVerify} disabled={verifyAdmin.isPending}>
                        {verifyAdmin.isPending ? "Verifying..." : "Verify Access"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
