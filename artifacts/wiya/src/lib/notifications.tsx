import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { CATEGORIES } from "./data";

export interface Alert {
  id: string;
  type: "wilaya" | "category";
  value: string;
  label: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  wilaya: string;
  category: string;
  matchedAlert: string;
  timestamp: number;
  read: boolean;
}

interface NotificationsContextType {
  alerts: Alert[];
  notifications: AppNotification[];
  toastQueue: AppNotification[];
  addAlert: (type: "wilaya" | "category", value: string, label: string) => void;
  removeAlert: (id: string) => void;
  hasAlert: (type: "wilaya" | "category", value: string) => boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
  unreadCount: number;
  dismissToast: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "timestamp">) => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const ALERTS_KEY = "wiya_alerts";
const NOTIFS_KEY = "wiya_notifications";

function loadAlerts(): Alert[] {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? "[]"); } catch { return []; }
}

function saveAlerts(alerts: Alert[]) {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)); } catch {}
}

function loadNotifications(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(NOTIFS_KEY) ?? "[]"); } catch { return []; }
}

function saveNotifications(notifs: AppNotification[]) {
  try { localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs.slice(0, 50))); } catch {}
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts);
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);
  const [toastQueue, setToastQueue] = useState<AppNotification[]>([]);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    const channel = supabase
      .channel("public:listings:new")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "listings",
        },
        (payload) => {
          const listing = payload.new as any;
          if (!listing.is_active) return;

          const currentAlerts = alertsRef.current;
          if (currentAlerts.length === 0) return;

          const matched = currentAlerts.find(
            (a) =>
              (a.type === "wilaya" && a.value === listing.wilaya) ||
              (a.type === "category" && a.value === listing.category)
          );

          if (!matched) return;

          const notif: AppNotification = {
            id: `notif_${Date.now()}`,
            listingId: listing.id,
            listingTitle: listing.title,
            listingImage: listing.images?.[0] ?? "",
            listingPrice: listing.price ?? 0,
            wilaya: listing.wilaya ?? "",
            category: listing.category ?? "",
            matchedAlert: matched.label,
            timestamp: Date.now(),
            read: false,
          };

          setNotifications((prev) => [notif, ...prev].slice(0, 50));
          setToastQueue((prev) => [...prev, notif]);

          setTimeout(() => {
            setToastQueue((prev) => prev.filter((t) => t.id !== notif.id));
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addAlert = useCallback((type: "wilaya" | "category", value: string, label: string) => {
    const id = `alert_${Date.now()}`;
    setAlerts((prev) => [...prev, { id, type, value, label, createdAt: Date.now() }]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const hasAlert = useCallback(
    (type: "wilaya" | "category", value: string) =>
      alerts.some((a) => a.type === type && a.value === value),
    [alerts]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "timestamp">) => {
    const notif: AppNotification = { ...n, id: `notif_push_${Date.now()}`, timestamp: Date.now() };
    setNotifications((prev) => [notif, ...prev].slice(0, 50));
    setToastQueue((prev) => [...prev, notif]);
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((t) => t.id !== notif.id));
    }, 6000);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        alerts,
        notifications,
        toastQueue,
        addAlert,
        removeAlert,
        hasAlert,
        markAllRead,
        markRead,
        unreadCount,
        dismissToast,
        pushNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
