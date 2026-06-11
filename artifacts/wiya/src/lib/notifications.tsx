import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { LISTINGS, CATEGORIES } from "./data";
import { WILAYAS_DATA } from "./wilayas";

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

const FAKE_TITLES_FR = [
  "Appartement F2 à vendre",
  "iPhone 15 Pro Max - Neuf",
  "Voiture Peugeot 208 - 2021",
  "Canapé moderne en cuir",
  "MacBook Air M3 - Comme neuf",
  "Villa avec piscine",
  "Moto Yamaha R1 - 2020",
  "Réfrigérateur Samsung - Neuf",
  "Studio meublé à louer",
  "Toyota Yaris 2022",
  "Terrain 500m² viabilisé",
  "PS5 + 5 jeux",
  "Vêtements enfants - Lot",
  "Offre d'emploi - Comptable",
  "Chien husky 3 mois",
];

const FAKE_IMAGES = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&q=70",
  "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200&q=70",
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=200&q=70",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=70",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=70",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&q=70",
  "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=200&q=70",
];

const FAKE_PRICES = [
  8000, 15000, 35000, 45000, 65000, 90000, 110000, 145000, 200000, 350000, 480000, 750000,
];

let notifCounter = 100;

function generateFakeNotification(alerts: Alert[]): AppNotification | null {
  if (alerts.length === 0) return null;

  const alert = alerts[Math.floor(Math.random() * alerts.length)];
  const wilayaList = WILAYAS_DATA.map((w) => w.name);
  const categoryList = CATEGORIES.map((c) => c.id);

  let wilaya: string;
  let category: string;

  if (alert.type === "wilaya") {
    wilaya = alert.value;
    category = categoryList[Math.floor(Math.random() * categoryList.length)];
  } else {
    category = alert.value;
    wilaya = wilayaList[Math.floor(Math.random() * wilayaList.length)];
  }

  const title = FAKE_TITLES_FR[Math.floor(Math.random() * FAKE_TITLES_FR.length)];
  const image = FAKE_IMAGES[Math.floor(Math.random() * FAKE_IMAGES.length)];
  const price = FAKE_PRICES[Math.floor(Math.random() * FAKE_PRICES.length)];

  const id = `notif_${++notifCounter}`;
  const fakeListingId = `fake_${notifCounter}`;

  return {
    id,
    listingId: fakeListingId,
    listingTitle: title,
    listingImage: image,
    listingPrice: price,
    wilaya,
    category,
    matchedAlert: alert.label,
    timestamp: Date.now(),
    read: false,
  };
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    listingId: "9",
    listingTitle: "Toyota Corolla 2022 – 12 000 km",
    listingImage: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=200&q=70",
    listingPrice: 420000,
    wilaya: "Sétif",
    category: "vehicles",
    matchedAlert: "Sétif",
    timestamp: Date.now() - 1000 * 60 * 5,
    read: true,
  },
  {
    id: "n2",
    listingId: "1",
    listingTitle: "iPhone 14 Pro 256GB – Excellent état",
    listingImage: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200&q=70",
    listingPrice: 145000,
    wilaya: "Alger",
    category: "electronics",
    matchedAlert: "Électronique",
    timestamp: Date.now() - 1000 * 60 * 30,
    read: true,
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "a1", type: "wilaya", value: "Alger", label: "Alger", createdAt: Date.now() - 86400000 },
    { id: "a2", type: "category", value: "electronics", label: "Électronique", createdAt: Date.now() - 86400000 },
  ]);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [toastQueue, setToastQueue] = useState<AppNotification[]>([]);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

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

  useEffect(() => {
    const interval = setInterval(() => {
      const currentAlerts = alertsRef.current;
      if (currentAlerts.length === 0) return;

      const notif = generateFakeNotification(currentAlerts);
      if (!notif) return;

      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setToastQueue((prev) => [...prev, notif]);

      setTimeout(() => {
        setToastQueue((prev) => prev.filter((t) => t.id !== notif.id));
      }, 5000);
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ alerts, notifications, toastQueue, addAlert, removeAlert, hasAlert, markAllRead, markRead, unreadCount, dismissToast, pushNotification }}
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
