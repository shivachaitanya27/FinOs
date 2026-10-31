"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  RefreshCw,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Menu,
  ChevronDown,
  Check,
  CheckCheck,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinOSLogo, FinOSIcon } from "@/components/ui/logo";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onRefreshData?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export function Header({ onToggleMobileMenu, onRefreshData }: HeaderProps) {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      setSeedStatus("Reloading...");
      const res = await fetch("/api/demo-data", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedStatus("Data Reloaded!");
        if (onRefreshData) onRefreshData();
        loadNotifications();
        setTimeout(() => {
          setSeedStatus(null);
          window.location.reload();
        }, 800);
      } else {
        setSeedStatus("Failed");
        setTimeout(() => setSeedStatus(null), 2500);
      }
    } catch (err) {
      setSeedStatus("Error");
      setTimeout(() => setSeedStatus(null), 2500);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />;
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 w-full border-b border-slate-200/90 bg-white/85 backdrop-blur-2xl px-4 lg:px-8 flex items-center justify-between shadow-2xs">
      {/* Left Section: Mobile Menu + Logo & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5 text-sky-600" />
        </button>

        <div className="lg:hidden">
          <FinOSLogo size="sm" showText={false} />
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="sky" className="px-2.5 py-0.5">
            Stage 6 Production
          </Badge>
          <span className="text-xs text-slate-500 hidden md:inline">
            Indian Financial Accounting Standard (Ind AS)
          </span>
        </div>
      </div>

      {/* Right Section: Actions + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Load Demo Data Button - Glassmorphic with Sky Accent */}
        <Button
          variant="glass-sky"
          size="sm"
          onClick={handleSeedDemo}
          disabled={isSeeding}
          className="text-xs h-8 px-3 font-semibold"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1.5 text-sky-600 ${
              isSeeding ? "animate-spin" : ""
            }`}
          />
          {seedStatus || (
            <>
              <span className="hidden sm:inline">Reload</span> Demo Data
            </>
          )}
        </Button>

        {/* Currency Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 backdrop-blur-md">
          <span className="font-bold text-sky-600">₹</span>
          <span>INR</span>
        </div>

        {/* Interactive Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifsOpen(!notifsOpen);
              setUserDropdownOpen(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title={unreadCount > 0 ? `${unreadCount} unread financial alerts` : "Notifications"}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-red-500/50 animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white/98 p-0 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {loadingNotifs && notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading alerts...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active notifications. All systems healthy.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.linkUrl) {
                          setNotifsOpen(false);
                          router.push(n.linkUrl);
                        }
                      }}
                      className={`p-3.5 text-left transition-colors cursor-pointer flex gap-3 ${
                        n.isRead
                          ? "bg-transparent hover:bg-slate-50 opacity-70"
                          : "bg-sky-50/60 hover:bg-sky-50"
                      }`}
                    >
                      {getNotificationIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs font-semibold truncate ${
                              n.isRead ? "text-slate-600" : "text-slate-900"
                            }`}
                          >
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              className="text-[10px] text-slate-400 hover:text-sky-600 shrink-0 p-1 rounded"
                              title="Mark read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                          <span>
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {n.linkUrl && (
                            <span className="text-sky-600 font-semibold flex items-center gap-0.5">
                              View <ExternalLink className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 text-center">
                <Link
                  href="/financial-risks"
                  onClick={() => setNotifsOpen(false)}
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                >
                  View All Financial Risks & Alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotifsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-sky-500/20">
              AS
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                Aarav Sharma
              </p>
              <p className="text-[10px] text-sky-600 font-medium">Founder & CEO</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white/98 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 z-50">
              <div className="px-3 py-2 border-b border-slate-100 text-xs">
                <p className="font-bold text-slate-900">Aarav Sharma</p>
                <p className="text-slate-500 text-[11px] truncate">
                  aarav.sharma@bharattech.in
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:text-sky-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                >
                  <User className="h-3.5 w-3.5 text-sky-600" />
                  Business Profile Setup
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-left transition-colors font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
