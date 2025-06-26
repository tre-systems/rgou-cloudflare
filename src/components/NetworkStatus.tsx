"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      // Show status briefly when going offline/online
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);

      return () => clearTimeout(timer);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm font-medium transition-all duration-300 ${
        isOnline ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline</span>
        </>
      )}
    </div>
  );
}
