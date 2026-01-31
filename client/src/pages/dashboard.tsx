import { useProfile } from "@/hooks/use-profiles";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { 
  Library, 
  ShieldCheck, 
  Bot, 
  Users, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: profile } = useProfile();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Welcome back, <span className="text-primary">{profile?.username || 'Student'}</span>!
            </h1>
            <p className="text-muted-foreground mt-1">Ready to continue your learning journey?</p>
          </div>
          <div className="flex items-center gap-2 text-sm bg-accent/10 text-accent px-4 py-2 rounded-full border border-accent/20">
            <Sparkles className="w-4 h-4" />
            <span>Premium Member</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard 
            title="Rankers Library"
            description="Access study materials"
            icon={Library}
            href="/library"
            color="bg-blue-500/10 text-blue-600"
          />
          <DashboardCard 
            title="Study Vault"
            description="Your personal storage"
            icon={ShieldCheck}
            href="/vault"
            color="bg-emerald-500/10 text-emerald-600"
          />
          <DashboardCard 
            title="AI Tutor"
            description="Get instant help"
            icon={Bot}
            href="/ai-tutor"
            color="bg-purple-500/10 text-purple-600"
          />
          <DashboardCard 
            title="Community"
            description="Join discussions"
            icon={Users}
            href="/community"
            color="bg-orange-500/10 text-orange-600"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm border-border/60">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Track your learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg">No recent activity</h3>
                <p className="text-muted-foreground max-w-sm">
                  Start by exploring the library or asking a question to the AI Tutor.
                </p>
                <Link href="/library">
                  <Button variant="outline" className="mt-2">Explore Library</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/ai-tutor">
                <Button className="w-full justify-start text-left h-auto py-3 px-4" variant="outline">
                  <Bot className="mr-3 w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-semibold">Ask AI Tutor</div>
                    <div className="text-xs text-muted-foreground">Get help with a topic</div>
                  </div>
                  <ArrowRight className="ml-auto w-4 h-4 opacity-50" />
                </Button>
              </Link>
              <Link href="/vault">
                <Button className="w-full justify-start text-left h-auto py-3 px-4" variant="outline">
                  <ShieldCheck className="mr-3 w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold">Upload Notes</div>
                    <div className="text-xs text-muted-foreground">Save to your vault</div>
                  </div>
                  <ArrowRight className="ml-auto w-4 h-4 opacity-50" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function DashboardCard({ title, description, icon: Icon, href, color }: any) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-border/60">
        <CardContent className="p-6 flex flex-col items-start gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
