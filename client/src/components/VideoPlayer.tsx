import { X, Maximize, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  posterUrl: string;
  onClose?: () => void;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
  user?: any;
  hasPurchased?: boolean;
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
    const vimeoParams = 'autoplay=1&badge=0&title=0&byline=0&portrait=0&controls=1&dnt=1';
    
    if (url.includes('player.vimeo.com/video/')) {
      if (url.includes('?')) {
        if (!url.includes('autoplay=')) {
          processedUrl = url + '&autoplay=1';
        } else {
          processedUrl = url;
        }
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
      if (url.includes('?')) {
        if (!url.includes('autoplay=')) {
          processedUrl = url + '&autoplay=true';
        } else {
          processedUrl = url;
        }
      } else {
        processedUrl = url + '?' + cfParams;
      }
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
    if (url.includes('?')) {
      if (!url.includes('autoplay=')) {
        processedUrl = url + '&autoplay=true';
      } else {
        processedUrl = url;
      }
    } else {
      processedUrl = url + '?autoplay=true';
    }
  }
  else if (url.includes('/embed/') || url.includes('player.') || url.includes('/iframe')) {
    processedUrl = url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
  }
  else {
    processedUrl = url;
  }

  return processedUrl;
}

export default function VideoPlayer({ title, videoUrl, posterUrl, onClose, hasPurchased = false }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : "";

  const toggleBrowserFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsBrowserFullscreen(true);
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && 'screen' in window && 'orientation' in window.screen) {
          try {
            await (window.screen.orientation as any).lock('landscape').catch(() => {});
          } catch (e) {}
        }
      } else {
        await document.exitFullscreen();
        setIsBrowserFullscreen(false);
        
        if ('screen' in window && 'orientation' in window.screen) {
          try {
            (window.screen.orientation as any).unlock();
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if ('screen' in window && 'orientation' in window.screen) {
        try {
          (window.screen.orientation as any).unlock();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      data-testid="player-video"
    >
      <div 
        ref={containerRef}
        className="relative bg-black overflow-hidden w-full h-full flex flex-col"
      >
        <div className="relative w-full h-full flex-1 bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full"
              style={{ colorScheme: 'normal' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              data-testid="iframe-video"
            />
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center flex items-center justify-center"
              style={{ backgroundImage: `url(${posterUrl})` }}
            >
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-xl mb-2">{title}</p>
                  <p className="text-sm text-gray-400">No video URL available</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 gap-2"
              onClick={onClose}
              data-testid="button-back-player"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </Button>
            
            <h3 className="text-white text-sm font-medium truncate flex-1 text-center px-4">{title}</h3>
            
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-9 w-9"
                onClick={toggleBrowserFullscreen}
                data-testid="button-fullscreen"
                title="Enter browser fullscreen"
              >
                <Maximize className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-9 w-9"
                onClick={onClose}
                data-testid="button-close-player"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
