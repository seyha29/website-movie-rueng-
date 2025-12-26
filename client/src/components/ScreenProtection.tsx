import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { screenProtectionLabels } from "@/lib/translations";

interface ScreenProtectionProps {
  children: React.ReactNode;
  showWarnings?: boolean;
  userName?: string;
  onSecurityViolation?: () => void;
}

export default function ScreenProtection({ 
  children, 
  showWarnings = true, 
  userName = "User",
  onSecurityViolation 
}: ScreenProtectionProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = screenProtectionLabels;
  const [detectionCount, setDetectionCount] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);
  const lastDetectionTime = useRef(0);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const handleScreenshotAttempt = useCallback((method: string) => {
    const now = Date.now();
    
    if (now - lastDetectionTime.current < 2000) {
      return;
    }
    
    lastDetectionTime.current = now;
    setDetectionCount(prev => prev + 1);

    if (showWarnings) {
      toast({
        title: t.screenshotDetected[language],
        description: `${t.contentProtected[language]} (${userName})`,
        variant: "destructive",
        duration: 5000,
      });
    }

    logSecurityEvent("screenshot_attempt", method);
    
    if (onSecurityViolation) {
      onSecurityViolation();
    }
  }, [showWarnings, userName, toast, onSecurityViolation, language, t]);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        handleScreenshotAttempt("Print Screen");
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText("Screen recording is not allowed").catch(() => {});
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleScreenshotAttempt("Snipping Tool");
      }

      if ((e.key === "3" || e.key === "4" || e.key === "5") && e.shiftKey && e.metaKey) {
        e.preventDefault();
        handleScreenshotAttempt("macOS Screenshot");
      }

      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i"))) {
        e.preventDefault();
        handleScreenshotAttempt("Developer Tools");
      }

      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        handleScreenshotAttempt("Print");
      }

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleScreenshotAttempt("Save");
      }

      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        handleScreenshotAttempt("View Source");
      }

      if (e.ctrlKey && e.shiftKey && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        handleScreenshotAttempt("Developer Console");
      }

      if (e.ctrlKey && e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        handleScreenshotAttempt("Inspect Element");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (showWarnings) {
        toast({
          title: t.rightClickDisabled[language],
          description: t.contentProtectedFromCopy[language],
          variant: "destructive",
        });
      }
      logSecurityEvent("right_click_attempt", "Right click");
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        const videos = document.querySelectorAll('video');
        videos.forEach(video => video.pause());
        
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          } catch (e) {}
        });
      } else {
        setIsBlurred(false);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setIsBlurred(false);
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (showWarnings) {
        toast({
          title: t.copyDisabled[language],
          description: t.cannotCopyContent[language],
          variant: "destructive",
        });
      }
      logSecurityEvent("copy_attempt", "Copy");
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [showWarnings, toast, handleScreenshotAttempt, language, t]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .screen-protected {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        pointer-events: auto;
      }
      .screen-protected img,
      .screen-protected video,
      .screen-protected iframe {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none;
      }
      .screen-protected iframe {
        pointer-events: auto;
      }
      @media print {
        .screen-protected {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const logSecurityEvent = async (eventType: string, details: string) => {
    const violationTypeMap: Record<string, string> = {
      'screenshot_attempt': 'keyboard_shortcut',
      'Print Screen': 'keyboard_shortcut',
      'Snipping Tool': 'keyboard_shortcut',
      'macOS Screenshot': 'keyboard_shortcut',
      'Developer Tools': 'devtools',
      'Developer Console': 'devtools',
      'Inspect Element': 'devtools',
      'View Source': 'devtools',
      'Print': 'keyboard_shortcut',
      'Save': 'keyboard_shortcut',
      'right_click_attempt': 'right_click',
      'Right click': 'right_click',
      'copy_attempt': 'copy_attempt',
      'Copy': 'copy_attempt',
    };
    
    const violationType = violationTypeMap[details] || violationTypeMap[eventType] || 'suspicious_behavior';
    
    try {
      await fetch("/api/security/violation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          violationType,
          description: `${eventType}: ${details} (User: ${userName})`,
        }),
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  };

  return (
    <div 
      className={`screen-protected ${isBlurred ? 'blur-lg transition-all duration-300' : ''}`}
      style={{ 
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {isBlurred && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
          <div className="text-center text-white p-8">
            <p className="text-2xl font-bold mb-4">{t.contentProtectedTitle[language]}</p>
            <p className="text-gray-300">{t.returnToWatch[language]}</p>
            <p className="text-sm text-gray-500 mt-4">{t.returnToWatchSub[language]}</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
