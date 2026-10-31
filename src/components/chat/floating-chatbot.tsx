"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  RefreshCw,
  PlusCircle,
  History,
  Trash2,
  ChevronDown,
  Minimize2,
  Maximize2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string | Date;
}

interface ConversationItem {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

const SUGGESTED_QUESTIONS = [
  "What is my total revenue this month?",
  "Why did my expenses increase?",
  "What are my biggest expense categories?",
  "Identify unusual transactions",
  "How is my current cash flow?",
  "What financial risks should I focus on?",
  "How can I improve profitability?",
  "Which payments are still unmatched?",
  "Am I likely to face a cash shortage?",
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [businessName, setBusinessName] = useState<string>("BharatTech Solutions");
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Load active business name & past conversations on first open
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      if (messages.length === 0) {
        // Initial welcome message
        setMessages([
          {
            role: "assistant",
            content: `👋 **Welcome to FinOS AI Assistant!**\n\nI am your verified strategic financial copilot. I analyze your actual ledger transactions, bank reconciliation feeds, liquidity burn rates, and 30-day forecasts.\n\n*All numbers are derived from verified accounting calculations.*\n\nHow can I assist your finance team today?`,
          },
        ]);
      }
    }
  }, [isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          conversationId: conversationId || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.response) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.conversationId) {
          setConversationId(data.conversationId);
          loadConversations();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ ${
              data.error || "I could not generate an answer. Please verify your query or try again."
            }`,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Connection error while querying the FinOS intelligence engine. Please retry.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([
      {
        role: "assistant",
        content: `👋 **New session started.**\n\nAsk me about revenues, expense spikes, duplicate records, runway projections, or reconciliation items.`,
      },
    ]);
    setShowHistory(false);
  };

  const selectConversation = async (id: string) => {
    try {
      setIsLoading(true);
      setShowHistory(false);
      const res = await fetch(`/api/ai/conversations/${id}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        setConversationId(id);
        const parsedMsgs: Message[] = (data.conversation.messages || []).map((m: any) => ({
          role: m.role.toLowerCase() as "user" | "assistant",
          content: m.content,
        }));
        setMessages(parsedMsgs);
      }
    } catch (err) {
      console.error("Failed to load conversation history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (conversationId === id) {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Basic markdown parser for bold, bullet points, headers
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1" />;

          // Headers
          if (line.startsWith("### ")) {
            return (
              <h4 key={i} className="font-bold text-xs text-purple-900 dark:text-purple-300 mt-2 mb-1">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={i} className="font-bold text-sm text-purple-950 dark:text-purple-200 mt-2 mb-1">
                {line.replace("## ", "")}
              </h3>
            );
          }

          // Bullet points
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const clean = line.trim().substring(2);
            return (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 ml-1">
                <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">•</span>
                <span>{parseBold(clean)}</span>
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 ml-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  {line.trim().split(".")[0]}.
                </span>
                <span>{parseBold(line.trim().replace(/^\d+\.\s/, ""))}</span>
              </div>
            );
          }

          // Normal paragraph
          return (
            <p key={i} className="text-xs text-slate-700 dark:text-slate-300">
              {parseBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={index} className="text-slate-600 dark:text-slate-400 italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open FinOS AI Assistant"
            className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-purple-600 via-purple-500 to-emerald-500 p-0.5 shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-purple-600/30"
          >
            <div className="h-full w-full bg-white dark:bg-obsidian-900 rounded-full flex items-center justify-center group-hover:bg-purple-50 dark:group-hover:bg-obsidian-850 transition-colors shadow-inner">
              <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 transition-colors" />
            </div>
            {/* Live pulsing dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-obsidian-950"></span>
            </span>
          </button>
        ) : null}
      </div>

      {/* Main Chatbot Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white/98 dark:bg-obsidian-900/98 border border-purple-200/80 dark:border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl transition-all duration-200 overflow-hidden print:hidden ${
            isMinimized
              ? "w-80 h-14"
              : "w-[92vw] sm:w-[420px] h-[580px] max-h-[88vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-white/10 bg-purple-50/70 dark:bg-obsidian-850/80 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-purple-600 to-emerald-500 text-white shadow-sm shadow-purple-600/25">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">FinOS AI Assistant</span>
                </div>
                <p className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">Verified Financial Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                title="Conversation History"
                className={`p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-white dark:hover:bg-obsidian-800 transition-colors ${
                  showHistory ? "bg-white dark:bg-obsidian-800 text-purple-700 dark:text-purple-300" : ""
                }`}
              >
                <History className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={startNewConversation}
                title="New Conversation"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-white dark:hover:bg-obsidian-800 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Maximize" : "Minimize"}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-white dark:hover:bg-obsidian-800 transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* History Drawer Overlay */}
              {showHistory ? (
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-obsidian-950 p-3 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Saved Conversations
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startNewConversation}
                      className="text-[10px] h-6 px-2 text-purple-600 dark:text-purple-400 hover:text-purple-700"
                    >
                      + Start New
                    </Button>
                  </div>

                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No previous chat sessions located.
                    </div>
                  ) : (
                    conversations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectConversation(c.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors group flex items-start justify-between gap-2 ${
                          c.id === conversationId
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700/60 shadow-2xs"
                            : "bg-white dark:bg-obsidian-900 border-slate-200 dark:border-white/10 hover:bg-purple-50/40 dark:hover:bg-obsidian-850"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">{c.title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{c.lastMessage}</div>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(c.id, e)}
                          title="Delete Session"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Main Message Stream */
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-obsidian-900">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-6 w-6 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center text-purple-700 dark:text-purple-300 flex-shrink-0 mt-0.5">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-tr-none text-xs font-medium"
                              : "bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none text-xs"
                          }`}
                        >
                          {msg.role === "assistant"
                            ? renderFormattedContent(msg.content)
                            : msg.content}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-2.5 items-center text-xs text-slate-500 dark:text-slate-400">
                        <div className="h-6 w-6 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center text-purple-700 dark:text-purple-300 flex-shrink-0">
                          <Bot className="h-3.5 w-3.5 animate-pulse" />
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-obsidian-850 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                          <span>Consulting verified ledger records...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Question Chips (visible if few messages) */}
                  {messages.length <= 3 && !isLoading && (
                    <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-obsidian-850/70">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 px-1 mb-1.5 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        <span>Suggested Financial Queries:</span>
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                        {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="whitespace-nowrap px-3 py-1 rounded-full bg-white dark:bg-obsidian-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-white/10 hover:border-purple-300 text-slate-700 dark:text-slate-300 hover:text-purple-800 dark:hover:text-purple-200 transition-colors shadow-2xs font-medium"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Box Footer */}
                  <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-obsidian-900">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about revenue, expense spikes, runway..."
                        disabled={isLoading}
                        className="flex-1 bg-slate-50 dark:bg-obsidian-850 border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-colors font-medium"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !inputValue.trim()}
                        className="h-9 w-9 p-0 rounded-xl bg-gradient-to-tr from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-sm shadow-purple-600/25 disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 px-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified deterministic calculations</span>
                      <button
                        type="button"
                        onClick={startNewConversation}
                        className="hover:text-purple-700 dark:hover:text-purple-400 font-medium transition-colors"
                      >
                        Clear Chat
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
