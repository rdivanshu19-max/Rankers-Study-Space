import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Shield, Users, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Name Rankers</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-get-started-header">Get Started</Button>
          </a>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent"
            >
              Your Ultimate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-purple-600">
                Study Space
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Join the elite community of students. Access premium resources, 
              secure your personal study materials, and learn with AI.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="/api/login">
                <Button size="lg" data-testid="button-start-learning" className="h-14 px-8 rounded-full text-lg shadow-lg hover:shadow-primary/20 shadow-primary/10 transition-all hover:-translate-y-0.5">
                  Start Learning Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <FeatureCard 
              icon={BookOpen}
              title="Rankers Library"
              description="Access curated books, lecture notes, and question papers uploaded by experts."
              delay={0.3}
            />
            <FeatureCard 
              icon={Shield}
              title="Study Vault"
              description="Secure cloud storage for your personal study materials and notes."
              delay={0.4}
            />
            <FeatureCard 
              icon={BrainCircuit}
              title="AI Tutor"
              description="Personalized AI character that helps you learn and answers your doubts 24/7."
              delay={0.5}
            />
            <FeatureCard 
              icon={Users}
              title="Community"
              description="Connect with peers, share knowledge, and grow together."
              delay={0.6}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Name Rankers Study Space. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold mb-2 font-display">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
