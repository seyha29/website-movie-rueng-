import { X, Maximize, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect, useCallback } from "react";

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  posterUrl: string;
  onClose?: () => void;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
  user?: any;
  hasPurchased?: boolean;
  userId?: string;
  isTrusted?: boolean;
  noWatermark?: boolean;
  movieId?: string;
}

function getEmbedUrl(url: string): string {
  if (!url) return "";

  let processedUrl = "";

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';

    if (url.includes('/embed/')) {
      const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      videoId = match ? match[1] : '';
    } else if (url.includes('/shorts/')) {
      const match = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      videoId = match ? match[1] : '';
    } else if (url.includes('watch?v=')) {
      const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      videoId = match ? match[1] : '';
    } else if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      videoId = match ? match[1] : '';
    } else {
      const match = url.match(/([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : '';
    }

    if (videoId) {
      processedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
  }
  else if (url.includes('vimeo.com')) {
    const vimeoParams = 'autoplay=1&badge=0&title=0&byline=0&portrait=0&controls=0&dnt=1';
    if (url.includes('player.vimeo.com/video/')) {
      if (url.includes('?')) {
        processedUrl = url.includes('autoplay=') ? url : url + '&autoplay=1';
      } else {
        processedUrl = url + '?' + vimeoParams;
      }
    } else {
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      if (match && match[1]) {
        processedUrl = `https://player.vimeo.com/video/${match[1]}?${vimeoParams}`;
      }
    }
  }
  else if (url.includes('cloudflarestream.com') || url.includes('videodelivery.net')) {
    const cfParams = 'autoplay=true&muted=false&controls=true';
    if (url.includes('/iframe')) {
      processedUrl = url.includes('?') ? (url.includes('autoplay=') ? url : url + '&autoplay=true') : url + '?' + cfParams;
    } else {
      const cfRegex = /(?:cloudflarestream\.com|videodelivery\.net)\/([a-zA-Z0-9]+)/;
      const match = url.match(cfRegex);
      if (match && match[1]) {
        const customerMatch = url.match(/customer-([a-zA-Z0-9]+)\./);
        if (customerMatch) {
          processedUrl = `https://customer-${customerMatch[1]}.cloudflarestream.com/${match[1]}/iframe?${cfParams}`;
        } else {
          processedUrl = `https://iframe.videodelivery.net/${match[1]}?${cfParams}`;
        }
      }
    }
  }
  else if (url.includes('bunnycdn') || url.includes('b-cdn.net') || url.includes('iframe.mediadelivery.net')) {
    const params = 'autoplay=true';
    processedUrl = url.includes('?') ? (url.includes('autoplay=') ? url : url + '&autoplay=true') : url + '?' + params;
  }
  else if (url.includes('/embed/') || url.includes('player.') || url.includes('/iframe')) {
    processedUrl = url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
  } else {
    processedUrl = url;
  }

  return processedUrl;
}

async function logViolation(violationType: string, description: string, movieId?: string) {
  try {
    await fetch('/api/security/violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ violationType, description, movieId })
    });
  } catch (e) {
    console.error('Failed to log violation');
  }
}

export default function VideoPlayer({ 
  title, 
  videoUrl, 
  posterUrl, 
  onClose, 
  hasPurchased = false,
  userId,
  isTrusted = false,
  noWatermark = false,
  movieId
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(() => {
    if (isTrusted) return false;
    const acknowledged = localStorage.getItem('video_warning_acknowledged');
    const timestamp = localStorage.getItem('video_warning_timestamp');
    if (acknowledged && timestamp) {
      const ackTime = parseInt(timestamp);
      const hoursSinceAck = (Date.now() - ackTime) / (1000 * 60 * 60);
      if (hoursSinceAck < 24) return false;
    }
    return true;
  });
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 10, y: 10 });
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : "";

  const acknowledgeWarning = () => {
    localStorage.setItem('video_warning_acknowledged', 'true');
    localStorage.setItem('video_warning_timestamp', Date.now().toString());
    setShowWarning(false);
  };

  const handleViolation = useCallback((type: string, description: string, shouldBlock: boolean = false) => {
    logViolation(type, description, movieId);
    if (shouldBlock) {
      setIsBlocked(true);
      setBlockReason(description);
    }
  }, [movieId]);

  useEffect(() => {
    if (noWatermark) return;
    
    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 60 + 10,
        y: Math.random() * 60 + 10
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, [noWatermark]);

  useEffect(() => {
    if (isTrusted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleViolation('tab_switch', 'Multiple tab switches detected', true);
          } else {
            handleViolation('tab_switch', `Tab switch #${newCount}`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTrusted, handleViolation]);

  useEffect(() => {
    if (isTrusted) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('right_click', 'Right-click attempt blocked');
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        { key: 'F12', ctrl: false, shift: false },
        { key: 'I', ctrl: true, shift: true },
        { key: 'J', ctrl: true, shift: true },
        { key: 'C', ctrl: true, shift: true },
        { key: 'U', ctrl: true, shift: false },
        { key: 'S', ctrl: true, shift: false },
        { key: 'P', ctrl: true, shift: false },
      ];

      for (const blocked of blockedKeys) {
        if (
          e.key === blocked.key &&
          e.ctrlKey === blocked.ctrl &&
          e.shiftKey === blocked.shift
        ) {
          e.preventDefault();
          e.stopPropagation();
          handleViolation('keyboard_shortcut', `Blocked shortcut: ${e.key}`);
          return false;
        }
      }

      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('copy_attempt', 'Copy attempt blocked');
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
    };
  }, [isTrusted, onClose, handleViolation]);

  useEffect(() => {
    if (isTrusted) return;

    let devtoolsOpen = false;
    let devtoolsWarningShown = false;
    const threshold = 160;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          handleViolation('devtools', 'Developer tools detected', false);
          if (!devtoolsWarningShown) {
            devtoolsWarningShown = true;
            console.warn('[Security] Developer tools detected. This activity is being logged.');
          }
        }
      } else {
        devtoolsOpen = false;
      }
    };

    const interval = setInterval(checkDevTools, 2000);
    return () => clearInterval(interval);
  }, [isTrusted, handleViolation]);

  const toggleBrowserFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsBrowserFullscreen(true);

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && 'screen' in window && 'orientation' in window.screen) {
          try { await (window.screen.orientation as any).lock('landscape').catch(() => {}); } catch(e) {}
        }
      } else {
        await document.exitFullscreen();
        setIsBrowserFullscreen(false);
        if ('screen' in window && 'orientation' in window.screen) {
          try { (window.screen.orientation as any).unlock(); } catch(e) {}
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if ('screen' in window && 'orientation' in window.screen) {
        try { (window.screen.orientation as any).unlock(); } catch(e) {}
      }
    };
  }, []);

  if (showWarning) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-3">Important Notice</h2>
          <p className="text-gray-300 mb-4 text-sm leading-relaxed">
            Recording, copying, screen sharing, or redistribution of this content is 
            <span className="text-red-400 font-semibold"> strictly prohibited</span>.
          </p>
          <p className="text-gray-400 mb-6 text-xs">
            Violations will result in automatic account suspension or permanent ban. 
            All activity is monitored and logged.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-600 text-gray-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={acknowledgeWarning}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              I Understand, Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-red-950 border border-red-700 rounded-lg max-w-md w-full p-6 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Video Playback Blocked</h2>
          <p className="text-red-300 mb-4">
            {blockReason || 'A security violation was detected.'}
          </p>
          <p className="text-gray-400 mb-6 text-sm">
            This incident has been logged. Repeated violations may result in account suspension.
          </p>
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Close Player
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col select-none" 
      data-testid="player-video"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div ref={containerRef} className="relative bg-black overflow-hidden w-full h-full flex flex-col">
        <div className="relative w-full h-full flex-1 bg-black">
          {embedUrl ? (
            <>
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                style={{ colorScheme: 'normal', border: 'none', aspectRatio: '16/9' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                data-testid="iframe-video"
              />
              
              {!noWatermark && userId && (
                <div 
                  className="absolute pointer-events-none text-white/20 text-xs font-mono transition-all duration-1000 z-20"
                  style={{
                    left: `${watermarkPosition.x}%`,
                    top: `${watermarkPosition.y}%`,
                    transform: 'rotate(-15deg)',
                    textShadow: '0 0 2px rgba(0,0,0,0.5)'
                  }}
                >
                  <div>{userId.substring(0, 8)}</div>
                  <div>{new Date().toISOString().split('T')[0]}</div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${posterUrl})` }}>
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-xl mb-2">{title}</p>
                  <p className="text-sm text-gray-400">No video URL available</p>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2" onClick={onClose} data-testid="button-back-player">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </Button>

            <h3 className="text-white text-sm font-medium truncate flex-1 text-center px-4">{title}</h3>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-9 w-9" onClick={toggleBrowserFullscreen} data-testid="button-fullscreen" title="Enter browser fullscreen">
                <Maximize className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-9 w-9" onClick={onClose} data-testid="button-close-player">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
