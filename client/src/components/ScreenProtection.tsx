import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ScreenProtectionProps {
  children: React.ReactNode;
  showWarnings?: boolean;
  userName?: string;
}

export default function ScreenProtection({ children, showWarnings = true, userName = "User" }: ScreenProtectionProps) {
  const { toast } = useToast();
  const [detectionCount, setDetectionCount] = useState(0);
  const lastDetectionTime = useRef(0);

  useEffect(() => {
    // Screenshot keyboard detection
    const handleKeyUp = (e: KeyboardEvent) => {
      // Print Screen key (Windows)
      if (e.key === "PrintScreen") {
        handleScreenshotAttempt("Print Screen");
        
        // Clear clipboard to prevent pasting
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows: Win+Shift+S (Snipping Tool)
      if (e.key === "s" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        handleScreenshotAttempt("Snipping Tool");
      }

      // macOS: Cmd+Shift+3 (Full screenshot)
      if (e.key === "3" && e.shiftKey && e.metaKey) {
        handleScreenshotAttempt("macOS Screenshot");
      }

      // macOS: Cmd+Shift+4 (Partial screenshot)
      if (e.key === "4" && e.shiftKey && e.metaKey) {
        handleScreenshotAttempt("macOS Screenshot");
      }

      // macOS: Cmd+Shift+5 (Screenshot menu)
      if (e.key === "5" && e.shiftKey && e.metaKey) {
        handleScreenshotAttempt("macOS Screenshot");
      }
    };

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (showWarnings) {
        toast({
          title: "Right-click disabled",
          description: "This content is protected from copying.",
          variant: "destructive",
        });
      }
      return false;
    };

    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [showWarnings, toast]);

  const handleScreenshotAttempt = (method: string) => {
    const now = Date.now();
    
    // Debounce: only trigger once every 2 seconds
    if (now - lastDetectionTime.current < 2000) {
      return;
    }
    
    lastDetectionTime.current = now;
    setDetectionCount(prev => prev + 1);

    if (showWarnings) {
      toast({
        title: "⚠️ Screenshot Detected",
        description: `This content is protected and being monitored. Your activity has been logged. (${userName})`,
        variant: "destructive",
        duration: 5000,
      });
    }

    // Log the attempt
    logSecurityEvent("screenshot_attempt", method);
  };

  const logSecurityEvent = async (eventType: string, details: string) => {
    try {
      await fetch("/api/security/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          details,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // Silent fail - don't interrupt user experience
      console.error("Failed to log security event:", error);
    }
  };

  return <>{children}</>;
}
