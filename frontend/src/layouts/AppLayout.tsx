import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import { checkAuthStatus } from "@/features/auth/authThunk";
import type { AppDispatch } from "@/app/store";
import { WifiOff } from "lucide-react";

function AppLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        await dispatch(checkAuthStatus() as any);
      } finally {
        setLoading(false);
      }
    };

    loadAuthStatus();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm font-medium animate-pulse text-muted-foreground">
          Loading platform...
        </p>
      </div>
    );
  }

  return (
    <>
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center sticky top-0 z-50 shadow-xs flex items-center justify-center gap-2">
          <WifiOff className="size-3.5" />
          <span>You are currently offline. Viewing cached neighbourhood safety data.</span>
        </div>
      )}
      <Outlet />
      <Toaster position="top-right" richColors />
      {/* Fixed theme switcher at bottom-right across the application */}
      <ModeToggle className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 size-10 sm:size-11 rounded-full shadow-lg border border-border bg-background/95 backdrop-blur hover:bg-background hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer" />
    </>
  );
}

export default AppLayout;
