'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, Sparkles, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { storage, type ChatMessage } from '@/lib/storage-keys';
import { cn } from '@/lib/utils';
import { triggerAlert } from '@/lib/hooks/use-notifications';

const CHAT_API = '/api/chat';

export default function CopilotChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Suggested actions based on simulated insight
  const INITIAL_SUGGESTIONS = [
    "Identify fastest swap stations",
    "Analyze travel vs wait times",
    "Efficiency summary"
  ];

  useEffect(() => {
    setMessages(storage.getChatHistory());
    if (open && messages.length === 0) {
      setSuggestions(INITIAL_SUGGESTIONS);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGridContext = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      return JSON.stringify(data);
    } catch {
      return "Grid data unavailable";
    }
  };

  const getPredictionData = async () => {
    try {
      const [sRes, fRes] = await Promise.all([fetch('/api/stats'), fetch('/api/fleet')]);
      const stats = await sRes.json();
      const fleet = await fRes.json();

      const stations = stats.stations || [];
      const top3Stations = stations
        .sort((a: any, b: any) => (b.queueCount || 0) - (a.queueCount || 0))
        .slice(0, 3);

      const MOCK_REACH_TIME = 10;

      const predictions = top3Stations.map((s: any) => {
        const waitTime = (s.queueCount || 0) * 4;
        const isWorthIt = waitTime < MOCK_REACH_TIME;

        return {
          name: s.name,
          waitTime,
          reachTime: MOCK_REACH_TIME,
          isWorthIt,
          suggestion: isWorthIt
            ? `Recommend ${s.name} (${waitTime}m wait < ${MOCK_REACH_TIME}m reach)`
            : `Warn: ${s.name} congested (${waitTime}m wait > ${MOCK_REACH_TIME}m reach)`
        };
      });

      return predictions;
    } catch { return []; }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    storage.setChatHistory(next);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const stats = await fetchGridContext();
      const predictions = await getPredictionData();

      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are the Battery Smart AI Copilot. 
              Grid Context: ${stats}
              Time Intelligence: ${JSON.stringify(predictions)}
              Instruction: Be brief. Use time-based metrics ONLY (Wait Time vs Reach Time). If wait time exceeds reach time (10m), advise against that station. Stop using Load %; use minutes.`
            },
            ...next.map((m) => ({ role: m.role, content: m.content }))
          ],
        }),
      });

      const data = await res.json().catch(() => ({}));
      const content =
        res.ok && data.message?.content
          ? data.message.content
          : data.error ?? 'Connection to AI Hub lost. Check API configuration.';

      const assistantMsg: ChatMessage = { role: 'assistant', content };
      const updated = [...next, assistantMsg];
      setMessages(updated);
      storage.setChatHistory(updated);

      // Parameterized Suggestions
      if (predictions.length > 0) {
        setSuggestions(predictions.slice(0, 2).map((p: any) => p.suggestion));
      } else {
        setSuggestions(["Identify critical hubs", "Optimize efficiency", "Summarize Status"]);
      }

    } catch (err) {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Request failed.',
      };
      setMessages([...next, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action.includes("Warn") || action.includes("Recommend") || action.includes("Execute")) {
      triggerAlert({
        type: 'info',
        title: 'Tactical Advice Dispatched',
        description: `Logic update: ${action}`,
        message: 'Fleet targets adjusted based on wait times.'
      });
    }
    sendMessage(action);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-2 border-black bg-white hover:bg-zinc-50 text-black font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Command Hub
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0 bg-white border-l-4 border-black">
        <SheetHeader className="p-6 border-b-4 border-black bg-zinc-50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-black font-black uppercase tracking-tighter flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              AI Command Layer
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={() => { setMessages([]); storage.setChatHistory([]); }} className="text-[10px] font-bold uppercase text-zinc-400">
              Reset
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Wait-Time Radar: Active</span>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-900 leading-relaxed">
                  Ready for time-critical dispatch. I'm comparing swap wait times with driver travel times.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-xl px-4 py-3 text-xs leading-relaxed transition-all',
                  m.role === 'user'
                    ? 'ml-auto bg-zinc-900 text-white font-bold max-w-[85%] shadow-lg'
                    : 'bg-zinc-100 text-zinc-900 border-2 border-black/5 max-w-[90%] font-medium'
                )}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest px-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Calculating Travel Deltas…
              </div>
            )}

            {!loading && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(s)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-black bg-white text-[10px] font-black uppercase tracking-tight hover:bg-zinc-50 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Zap className="w-3 h-3 text-orange-500" />
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t-4 border-black bg-zinc-50 flex gap-2">
          <Input
            placeholder="Analyze station time…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="flex-1 border-2 border-black bg-white font-bold placeholder:text-zinc-300 rounded-xl"
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-black hover:bg-zinc-800 text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
