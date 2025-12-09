import { X, Maximize, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import DynamicWatermark from "@/components/DynamicWatermark";
import ScreenProtection from "@/components/ScreenProtection";
import adBanner1 from "@assets/TAPTAP2-728x180-3_1764365836520.gif";
import adBanner2 from "@assets/DAFABET-728x180-1_1764365836521.gif";

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

// Obfuscate video provider identification
function obfuscateUrl(url: string): string {
  // Add random parameter to prevent easy URL matching
  const randomParam = `_t=${Date.now()}`;
  return url.includes('?') ? `${url}&${randomParam}` : `${url}?${randomParam}`;
}

function getEmbedUrl(url: string): string {
  if (!url) return "";

  let processedUrl = "";

  // YouTube embed handling
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('/embed/')) {
      processedUrl = url;
    } else {
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        // Use nocookie domain for better privacy and compatibility
        processedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;
      }
    }
  }
  // Vimeo embed handling - with branding removal for paid plans
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
  // Cloudflare Stream handling
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
  // Bunny.net Stream handling
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
  // Other embed URLs
  else if (url.includes('/embed/') || url.includes('player.') || url.includes('/iframe')) {
    processedUrl = url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
  }
  else {
    processedUrl = url;
  }

  return processedUrl;
}

export default function VideoPlayer({ title, videoUrl, posterUrl, onClose, requiresAuth, onAuthRequired, user, hasPurchased = false }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : "";

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        
        // Try to lock orientation to landscape (mobile devices)
        if ('screen' in window && 'orientation' in window.screen) {
          try {
            await (window.screen.orientation as any).lock('landscape').catch(() => {
              // Orientation lock may not be supported or allowed
            });
          } catch (e) {
            // Ignore orientation lock errors
          }
        }
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
        
        // Unlock orientation
        if ('screen' in window && 'orientation' in window.screen) {
          try {
            (window.screen.orientation as any).unlock();
          } catch (e) {
            // Ignore unlock errors
          }
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes with proper cleanup
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-fullscreen on mobile for purchased videos
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && embedUrl && containerRef.current) {
      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(async () => {
        try {
          // Request fullscreen
          if (containerRef.current && !document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
            setIsFullscreen(true);
            
            // Lock orientation to landscape on mobile
            if ('screen' in window && 'orientation' in window.screen) {
              try {
                await (window.screen.orientation as any).lock('landscape').catch(() => {});
              } catch (e) {
                // Orientation lock may not be supported
              }
            }
          }
        } catch (error) {
          // Fullscreen may be blocked by browser - user interaction required
          console.log('Auto-fullscreen not available, user interaction required');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [embedUrl]);

  // Handle Escape key to close player
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

  // Cleanup: exit fullscreen and unlock orientation when component unmounts
  useEffect(() => {
    return () => {
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      // Unlock orientation
      if ('screen' in window && 'orientation' in window.screen) {
        try {
          (window.screen.orientation as any).unlock();
        } catch (e) {
          // Ignore unlock errors
        }
      }
    };
  }, []);

  // Only apply protection if user is provided (authenticated)
  const ProtectionWrapper = user ? ScreenProtection : "div";
  const protectionProps = user ? { showWarnings: true, userName: user.fullName } : {};

  return (
    // @ts-ignore
    <ProtectionWrapper {...protectionProps}>
      {/* Dark overlay background */}
      <div 
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        data-testid="player-video"
      >
        {/* Main container - prevent click propagation */}
        <div 
          ref={containerRef}
          className={`relative bg-black overflow-hidden shadow-2xl ${
            isFullscreen 
              ? 'w-full h-full flex flex-col' 
              : 'w-full max-w-4xl rounded-lg'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ad Banner 1 - Top (hidden in fullscreen) */}
          {!isFullscreen && (
            <a 
              href="https://taptapthai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full"
              data-testid="link-video-ad-banner-1"
            >
              <img 
                src={adBanner1} 
                alt="Advertisement" 
                className="w-full h-auto object-cover"
                data-testid="img-video-ad-banner-1"
              />
            </a>
          )}

          {/* Video Header with controls (hidden in fullscreen) */}
          {!isFullscreen && (
            <div className="flex items-center justify-between bg-zinc-900 px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 gap-2"
                onClick={onClose}
                data-testid="button-back-player"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </Button>
              
              <h3 className="text-white text-sm font-medium truncate flex-1 text-center px-4">{title}</h3>
              
              <div className="flex items-center gap-2">
                {embedUrl && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10 h-8 w-8"
                    onClick={toggleFullscreen}
                    data-testid="button-fullscreen"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10 h-8 w-8"
                  onClick={onClose}
                  data-testid="button-close-player"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Video Player - Full size in fullscreen mode */}
          <div className={`relative select-none bg-black ${
            isFullscreen 
              ? 'w-full h-full flex-1' 
              : 'w-full aspect-video'
          }`}>
            {embedUrl ? (
              <>
                <iframe
                  src={embedUrl}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  data-testid="iframe-video"
                />
                
              </>
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
            
            {/* Dynamic watermark overlay - only show if user hasn't purchased */}
            {user && !hasPurchased && <DynamicWatermark intensity="strong" showTimestamp={true} user={user} />}
            
            {/* Fullscreen exit button - only in fullscreen mode */}
            {isFullscreen && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 h-10 w-10 z-10"
                onClick={toggleFullscreen}
                data-testid="button-exit-fullscreen"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Ad Banner 2 - Bottom (hidden in fullscreen) */}
          {!isFullscreen && (
            <a 
              href="https://dafabet.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full"
              data-testid="link-video-ad-banner-2"
            >
              <img 
                src={adBanner2} 
                alt="Advertisement" 
                className="w-full h-auto object-cover"
                data-testid="img-video-ad-banner-2"
              />
            </a>
          )}
        </div>
      </div>
    {/* @ts-ignore */}
    </ProtectionWrapper>
  );
}
