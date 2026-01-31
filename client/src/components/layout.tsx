import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { 
  Library, 
  GraduationCap, 
  Users, 
  HelpCircle, 
  LogOut, 
  Menu,
  ShieldCheck,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { data: profile } = useProfile();
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: GraduationCap },
    { href: "/library", label: "Rankers Library", icon: Library },
    { href: "/vault", label: "Study Vault", icon: ShieldCheck },
    { href: "/community", label: "Community", icon: Users },
    { href: "/profile", label: "My Profile", icon: User },
    { href: "/help", label: "Help Center", icon: HelpCircle },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card border-r border-border/50">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Name Rankers
        </h1>
        <p className="text-sm text-muted-foreground">Study Space</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 py-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              font-medium text-sm
              ${isActive 
                ? 'bg-primary/10 text-primary shadow-sm' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }
            `}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>{profile?.username?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.username || 'Student'}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{profile?.role || 'student'}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 fixed inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-40 flex items-center px-4 justify-between">
        <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Name Rankers
        </span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
        <div className="container mx-auto max-w-7xl p-4 md:p-8 animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
