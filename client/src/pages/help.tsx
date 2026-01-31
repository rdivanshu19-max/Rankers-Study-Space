import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Help Center</h1>
          <p className="text-muted-foreground">We're here to help you succeed</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Need assistance with your account or technical issues?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Admin Email</p>
                  <p className="text-lg font-bold text-primary">admin@namerankers.edu</p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = 'mailto:admin@namerankers.edu'}>
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Usage Guide</h3>
                  <p className="text-sm text-muted-foreground mt-1">Learn how to use the Library and Study Vault efficiently.</p>
                </div>
                <Button variant="link" className="text-blue-600">Read Guide</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Community Rules</h3>
                  <p className="text-sm text-muted-foreground mt-1">Guidelines for maintaining a healthy learning environment.</p>
                </div>
                <Button variant="link" className="text-purple-600">View Guidelines</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
