import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Bot, Mic, Square, Loader2, User, Volume2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AITutor() {
  const { data: profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${profile?.username || 'Student'}! I'm your AI Tutor. How can I help you learn today?` }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio Integration hooks
  const recorder = useVoiceRecorder();
  const stream = useVoiceStream({
    onUserTranscript: (text) => {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    },
    onTranscript: (chunk, full) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === 'assistant') {
          return [...prev.slice(0, -1), { role: 'assistant', content: full }];
        }
        return [...prev, { role: 'assistant', content: full }];
      });
    },
    onComplete: () => {
      setIsProcessing(false);
    },
    onError: (err) => {
      console.error(err);
      setIsProcessing(false);
    }
  });

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMicClick = async () => {
    if (recorder.state === "recording") {
      setIsProcessing(true);
      const blob = await recorder.stopRecording();
      // Conversation ID 1 is hardcoded for demo simplicity
      // In a real app, you'd create/manage conversation IDs via API
      await stream.streamVoiceResponse('/api/conversations/1/messages', blob);
    } else {
      await recorder.startRecording();
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Personal AI Tutor</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Online & Ready to Help
            </p>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden shadow-lg border-purple-100 dark:border-purple-900 bg-white/50 dark:bg-black/20 backdrop-blur-sm relative">
          <ScrollArea className="h-full p-6" ref={scrollRef}>
            <div className="space-y-6 pb-20">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`
                    h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-purple-600 text-white'}
                  `}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`
                    p-4 rounded-2xl max-w-[80%] shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card text-card-foreground border border-border/50 rounded-tl-none'
                    }
                  `}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse ml-12">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Floating Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <AnimatePresence>
              {recorder.state === "recording" && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md"
                >
                  Listening...
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              size="lg"
              className={`
                h-16 w-16 rounded-full shadow-xl transition-all duration-300
                ${recorder.state === "recording" 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 scale-110' 
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30 hover:scale-105'
                }
              `}
              onClick={handleMicClick}
            >
              {recorder.state === "recording" ? (
                <Square className="w-6 h-6 fill-current" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
