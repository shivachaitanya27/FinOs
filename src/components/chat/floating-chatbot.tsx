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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    // Optimistically add user message
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
          loadConversations();
        }
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            role: "assistant",
            content: data.message.content,
            createdAt: data.message.createdAt,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ **Unable to complete request:** ${data.error || "Financial intelligence service encountered an issue. Please try again."}`,
          },
        ]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Connection Error:** Could not reach the FinOS backend engine. Please check your connection.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setShowHistory(false);
    setMessages([
      {
        role: "assistant",
        content: `👋 **New Financial Consultation Started**\n\nAsk me anything regarding your revenue, category spend surges, unmatched reconciliation items, or liquidity runway.`,
      },
    ]);
  };

  const selectConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ai/conversations/${convId}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        setConversationId(convId);
        setMessages(
          data.conversation.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
        setShowHistory(false);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/conversations/${convId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (conversationId === convId) {
        startNewConversation();
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple Markdown-to-HTML parser for bullet lists, bold text, and headers
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1" />;

          // Header ###
          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={i} className="font-bold text-white text-sm pt-1 pb-0.5 text-finteal-300">
                {trimmed.replace("### ", "")}
              </h4>
            );
          }

          // Bullet point * or -
          if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            const bulletText = trimmed.replace(/^[\*\-•]\s*/, "");
            return (
              <div key={i} className="flex items-start gap-1.5 pl-1 text-slate-200">
                <span className="text-finteal-400 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bulletText) }} />
              </div>
            );
          }

          // Blockquote >
          if (trimmed.startsWith("> ")) {
            return (
              <div key={i} className="p-2 rounded-lg bg-slate-900/80 border-l-2 border-finteal-400 text-slate-300 text-[11px] my-1">
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.replace("> ", "")) }} />
              </div>
            );
          }

          return (
            <p key={i} className="text-slate-200" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-finteal-300">$1</em>');
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open FinOS AI Assistant"
            className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-600 p-0.5 shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-sky-500/30"
          >
            <div className="h-full w-full bg-white rounded-full flex items-center justify-center group-hover:bg-sky-50 transition-colors shadow-inner">
              <Bot className="h-6 w-6 text-sky-600 group-hover:text-sky-700 transition-colors" />
            </div>
            {/* Live pulsing dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border-2 border-white"></span>
            </span>
          </button>
        ) : null}
      </div>

      {/* Main Chatbot Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white/95 border border-slate-200/90 rounded-3xl shadow-2xl backdrop-blur-2xl transition-all duration-200 overflow-hidden print:hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-3xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600 ${
            isMinimized
              ? "w-80 h-14"
              : "w-[92vw] sm:w-[420px] h-[580px] max-h-[88vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50/90 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-400 to-sky-600 text-white shadow-sm shadow-sky-500/25">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">FinOS AI Assistant</span>
                  <Badge variant="sky" className="text-[9px] px-1.5 py-0 font-bold">Stage 5</Badge>
                </div>
                <p className="text-[10px] text-sky-700 font-medium">Verified Financial Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                title="Conversation History"
                className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  showHistory ? "bg-slate-100 text-sky-700" : ""
                }`}
              >
                <History className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={startNewConversation}
                title="New Conversation"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Maximize" : "Minimize"}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* History Drawer Overlay */}
              {showHistory ? (
                <div className="flex-1 flex flex-col bg-slate-50 p-3 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Saved Conversations
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startNewConversation}
                      className="text-[10px] h-6 px-2 text-sky-600 hover:text-sky-700"
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
                            ? "bg-sky-50 border-sky-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-900 truncate">{c.title}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{c.lastMessage}</div>
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
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-6 w-6 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 flex-shrink-0 mt-0.5">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-tr-none text-xs"
                              : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none text-xs"
                          }`}
                        >
                          {msg.role === "assistant"
                            ? renderFormattedContent(msg.content)
                            : msg.content}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-2.5 items-center text-xs text-slate-500">
                        <div className="h-6 w-6 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 flex-shrink-0">
                          <Bot className="h-3.5 w-3.5 animate-pulse" />
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                          <span>Consulting verified ledger records...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Question Chips (visible if few messages) */}
                  {messages.length <= 3 && !isLoading && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 px-1 mb-1.5 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-sky-600" />
                        <span>Suggested Financial Queries:</span>
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                        {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-800 transition-colors shadow-2xs font-medium"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Box Footer */}
                  <div className="p-3 border-t border-slate-100 bg-white">
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
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 transition-colors font-medium"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !inputValue.trim()}
                        className="h-9 w-9 p-0 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold shadow-sm shadow-sky-500/25 disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
                      <span className="text-sky-700 font-medium">Verified deterministic calculations</span>
                      <button
                        type="button"
                        onClick={startNewConversation}
                        className="hover:text-sky-700 font-medium transition-colors"
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

