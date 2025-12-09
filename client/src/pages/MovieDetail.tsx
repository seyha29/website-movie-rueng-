import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import AuthModal from "@/components/AuthModal";
import { PaymentModal } from "@/components/PaymentModal";
import { useMyList } from "@/hooks/use-my-list";
import { useVideoPurchaseGate } from "@/hooks/use-video-purchase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Check, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Movie } from "@shared/schema";

// Convert any video URL to proper embed format
function getTrailerEmbedUrl(url: string): string {
  if (!url) return "";
  
  // YouTube URL conversion
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // Already an embed URL
    if (url.includes('/embed/')) {
      return url;
    }
    // Regular YouTube URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // Vimeo URL conversion
  if (url.includes('vimeo.com')) {
    // Already player URL
    if (url.includes('player.vimeo.com')) {
      return url;
    }
    // Regular Vimeo URL
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const match = url.match(vimeoRegex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }
  
  // For QloudHost, iframe embeds, or other URLs - use as-is
  return url;
}

export default function MovieDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const movieId = params.id;
  const { toast } = useToast();
  
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"play" | "add" | null>(null);
  const [secureVideoUrl, setSecureVideoUrl] = useState<string | null>(null);
  
  const { inList: inMyListCheck, toggleMyList } = useMyList(movieId);
  
  // Fetch secure video URL from protected endpoint
  const fetchSecureVideoUrl = useCallback(async (movieId: string) => {
    try {
      const response = await fetch(`/api/videos/${movieId}/stream`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get video');
      }
      
      const data = await response.json();
      return data.videoUrl;
    } catch (error) {
      console.error('Failed to fetch secure video URL:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load video",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);
  
  const {
    checkAndExecute: checkVideoPurchaseAndExecute,
    showPaymentModal,
    handlePaymentSuccess,
    handlePaymentCancel,
    currentMovieId,
    currentMovieTitle,
  } = useVideoPurchaseGate();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: movie, isLoading } = useQuery<Movie>({
    queryKey: ["/api/movies", movieId],
    queryFn: async () => {
      const response = await fetch(`/api/movies/${movieId}`);
      if (!response.ok) throw new Error("Failed to fetch movie");
      return response.json();
    },
    enabled: !!movieId,
    staleTime: 5 * 60 * 1000,
  });

  const handlePlayMovie = () => {
    if (!user) {
      setPendingAction("play");
      setIsAuthModalOpen(true);
      return;
    }

    if (!movie) return;

    checkVideoPurchaseAndExecute(movie.id, movie.title, async () => {
      // Fetch secure video URL from protected endpoint
      const videoUrl = await fetchSecureVideoUrl(movie.id);
      if (videoUrl) {
        setSecureVideoUrl(videoUrl);
        setIsPlayerOpen(true);
      }
    });
  };

  const handleAddToList = () => {
    if (!user) {
      setPendingAction("add");
      setIsAuthModalOpen(true);
      return;
    }

    if (!movie) return;
    toggleMyList(movie.id);
  };

  const handleAuthSuccess = async () => {
    await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    
    if (pendingAction === "play") {
      handlePlayMovie();
    } else if (pendingAction === "add") {
      handleAddToList();
    }
    setPendingAction(null);
  };

  const inMyList = inMyListCheck;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-14 lg:pt-16">
          <div className="relative min-h-[50vh] lg:min-h-[60vh] bg-muted/20 animate-pulse" />
          <div className="p-4 lg:p-12">
            <div className="h-8 w-64 bg-muted/20 rounded animate-pulse mb-4" />
            <div className="h-4 w-full max-w-2xl bg-muted/20 rounded animate-pulse mb-2" />
            <div className="h-4 w-full max-w-xl bg-muted/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Backdrop Section */}
      <div className="relative pt-14 lg:pt-16">
        <div className="relative min-h-[50vh] lg:min-h-[60vh]">
          <img
            src={movie.backdropImage}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="relative h-full flex items-end">
            <div className="p-4 lg:p-12 pb-8 max-w-4xl">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 hover-elevate"
                onClick={() => navigate("/")}
                data-testid="button-back"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <h1 className="text-4xl lg:text-6xl font-bold mb-4" data-testid="text-movie-title">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30" data-testid="badge-rating">
                  ⭐ {movie.rating}
                </Badge>
                <span className="text-sm text-muted-foreground" data-testid="text-year">{movie.year}</span>
                <span className="text-sm text-muted-foreground" data-testid="text-duration">{movie.duration}</span>
                {movie.isFree === 1 && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30" data-testid="badge-free">
                    FREE
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <Badge key={genre} variant="outline" data-testid={`badge-genre-${genre.toLowerCase()}`}>
                    {genre}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={handlePlayMovie}
                  className="gap-2"
                  data-testid="button-play"
                >
                  <Play className="h-5 w-5 fill-current" />
                  {movie.isFree === 1 ? "Play Full Movie" : "Watch Full Movie ($1)"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleAddToList}
                  className="gap-2"
                  data-testid="button-add-to-list"
                >
                  {inMyList ? (
                    <>
                      <Check className="h-5 w-5" />
                      In My List
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      My List
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Overview</h2>
                <p className="text-base text-muted-foreground leading-relaxed" data-testid="text-description">
                  {movie.description}
                </p>
              </div>

              {/* Cast */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Cast</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.map((actor, index) => (
                    <Badge key={index} variant="secondary" className="text-sm" data-testid={`badge-actor-${index}`}>
                      {actor}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Trailer */}
              {movie.trailerUrl && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Trailer</h2>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      FREE TO WATCH
                    </Badge>
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-card" data-testid="section-trailer">
                    {movie.trailerUrl.toLowerCase().endsWith('.mp4') || movie.trailerUrl.toLowerCase().endsWith('.webm') ? (
                      <video
                        src={movie.trailerUrl}
                        controls
                        className="w-full h-full object-contain"
                        title={`${movie.title} Trailer`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <iframe
                        src={getTrailerEmbedUrl(movie.trailerUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={`${movie.title} Trailer`}
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {movie.isFree === 1 
                      ? "Watch the full movie for free by clicking 'Play Full Movie' above." 
                      : "This is a preview. Click 'Watch Full Movie ($1)' above to purchase and watch the complete film."}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Director</h3>
                <p className="text-base" data-testid="text-director">{movie.director}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Genres</h3>
                <p className="text-base">{movie.genres.join(", ")}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Release Year</h3>
                <p className="text-base">{movie.year}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Duration</h3>
                <p className="text-base">{movie.duration}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Rating</h3>
                <p className="text-base">⭐ {movie.rating}/10</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {isPlayerOpen && (
        <VideoPlayer
          title={movie.title}
          videoUrl={secureVideoUrl || undefined}
          posterUrl={movie.backdropImage}
          onClose={() => {
            setIsPlayerOpen(false);
            setSecureVideoUrl(null); // Clear secure URL when closing
          }}
          user={user}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      <PaymentModal
        open={showPaymentModal}
        onOpenChange={handlePaymentCancel}
        onSuccess={handlePaymentSuccess}
        mode="video"
        movieId={currentMovieId}
        movieTitle={currentMovieTitle}
      />
    </div>
  );
}
