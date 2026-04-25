import { useState, useRef, useEffect } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts: Record<AppRole | 'external', string[]> = {
  staff: [
    'What tasks are assigned to me?',
    'Show my pending documents',
    'What deadlines are due today?',
    'How do I upload a document?',
  ],
  approver: [
    'Show my pending approvals',
    'Which approvals are overdue?',
    'How many tasks did I complete this week?',
    'What documents need my review?',
  ],
  supervisor: [
    'Show SLA compliance report',
    'Which steps are bottlenecks?',
    'How many workflows are running?',
    'Show user performance summary',
  ],
  admin: [
    'How many active workflows exist?',
    'Show system health status',
    'List all document types',
    'How many users are configured?',
  ],
  external: [
    'How do I submit a document?',
    'What is the status of my submission?',
    'What file formats are accepted?',
    'How long does review take?',
  ],
};

const mockResponses: Record<string, Record<string, string>> = {
  staff: {
    'tasks': 'You have **3 tasks** assigned:\n- CONTRACT-2024-008 (Legal Review) — Due in 12h\n- EXP-2024-045 (Initial Submission) — Due in 48h\n- LEAVE-2024-102 (HR Review) — ✅ Completed',
    'documents': 'You have **5 documents**:\n- 3 In Workflow\n- 1 Draft\n- 1 Completed',
    'deadlines': '**Due Today:** 1 task (CONTRACT-2024-008)\n**Due Soon:** 1 task (EXP-2024-045)\n**Overdue:** None',
    'upload': 'To upload a document:\n1. Go to **Documents** page\n2. Click **Upload Document**\n3. Select file type and upload your file\n4. Start a workflow if needed',
  },
  approver: {
    'approvals': 'You have **4 pending approvals**:\n- PO-2024-0125 (High priority, 4h remaining)\n- INV-ACME-2024-002 (Critical, 1h remaining)\n- PO-2024-0130 (High, 2h remaining)\n- TRAVEL-2024-055 (⚠️ Overdue)',
    'overdue': '**1 overdue approval:** TRAVEL-2024-055 — overdue by 3 hours. Please take action.',
    'complete': 'This week you completed **8 tasks** with an average completion time of **4.8 hours**.',
    'review': 'The following documents need your review:\n- INV-ACME-2024-002 (Critical priority)\n- PO-2024-0125 (High priority)',
  },
  supervisor: {
    'sla': '**SLA Compliance Report:**\n- Overall: **92%** on-time\n- Finance Review: 91%\n- Legal Review: 82%\n- Manager Approval: 95%',
    'bottleneck': '**Top Bottlenecks:**\n1. CFO Approval — Avg 36.5h (25% breach rate)\n2. Legal Review — Avg 28.2h (18% breach rate)\n3. Finance Review — Avg 14.8h (9% breach rate)',
    'workflows': 'Currently **6 active workflow instances** running, 2 completed today, 1 rejected.',
    'performance': '**Top Performers:**\n1. John Smith — 100% on-time\n2. Alice Cooper — 97% on-time\n3. Sarah Johnson — 94% on-time',
  },
  admin: {
    'workflows': 'There are **3 active workflow templates** and **1 draft**.',
    'health': '**System Health:** ✅ All services operational\n- Database: Connected\n- Storage: 45% used\n- Last backup: 2 hours ago',
    'document': 'Document types configured: **5** (Purchase Order, Invoice, Contract, GRN, Expense Report)',
    'users': 'There are **6 users** across 4 roles:\n- 2 Staff, 2 Approvers, 1 Supervisor, 1 Admin',
  },
  external: {
    'submit': 'To submit a document:\n1. Click **Submit Document** on your dashboard\n2. Select document type\n3. Enter reference number and company name\n4. Upload your file\n5. Submit!',
    'status': 'You have **4 submissions:**\n- 1 Under Review\n- 1 Revision Required\n- 1 Completed\n- 1 Rejected',
    'format': 'We accept: **PDF, DOCX, XLSX** files up to **10MB**.',
    'review': 'Typical review time is **2-5 business days**. You\'ll be notified of any status changes.',
  },
};

const FORBIDDEN_MSG = "🔒 You don't have access to that data. Your role only permits viewing information within your scope.";

function getResponse(role: string, question: string): string {
  const effectiveRole = role === 'external' ? 'external' : role;
  const responses = mockResponses[effectiveRole] || {};
  const q = question.toLowerCase();

  // Check for forbidden cross-role queries
  const forbiddenPatterns: Record<string, string[]> = {
    staff: ['sla compliance', 'system health', 'all users', 'bottleneck', 'user performance', 'configure'],
    approver: ['sla compliance', 'system health', 'all users', 'bottleneck', 'configure', 'user performance'],
    external: ['internal', 'sla', 'users', 'system', 'config', 'workflow template', 'department', 'employee'],
  };

  const blocked = forbiddenPatterns[effectiveRole] || [];
  if (blocked.some(p => q.includes(p))) return FORBIDDEN_MSG;

  // Match keywords
  for (const [key, value] of Object.entries(responses)) {
    if (q.includes(key)) return value;
  }

  return `I can help you with questions about your ${effectiveRole === 'external' ? 'submissions' : 'tasks and documents'}. Try one of the suggested prompts!`;
}

export function AIChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const role = (user?.role || 'external') as AppRole | 'external';
  const prompts = suggestedPrompts[role] || suggestedPrompts.external;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response = getResponse(role, text);
      const assistantMsg: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      setTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[560px] flex flex-col rounded-xl border border-border bg-card shadow-2xl animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold text-sm">DocFlow AI Assistant</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[380px]">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="text-center py-4">
                  <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">How can I help you today?</p>
                </div>
                <div className="space-y-1.5">
                  {prompts.map(p => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-line",
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted px-3 py-2 rounded-lg text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border">
            <Input
              placeholder="Ask a question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <Button type="submit" size="icon" className="h-9 w-9" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
