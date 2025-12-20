import { useState, useCallback } from "react";
import { useParams, useLocation, Link } from "wouter";
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
import { Play, Plus, Check, ChevronLeft, Clock, Calendar, Film, Star, User, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Movie } from "@shared/schema";

function getTrailerEmbedUrl(url: string, autoplay: boolean = true): string {
  if (!url) return "";
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('/embed/')) {
      const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      videoId = match ? match[1] : '';
    } else {
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = url.match(youtubeRegex);
      videoId = match ? match[1] : '';
    }
    if (videoId) {
      const autoplayParam = autoplay ? '&autoplay=1&mute=1' : '';
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoplayParam}`;
    }
  }
  
  if (url.includes('vimeo.com')) {
    let videoId = '';
    if (url.includes('player.vimeo.com/video/')) {
      const match = url.match(/player\.vimeo\.com\/video\/(\d+)/);
      videoId = match ? match[1] : '';
    } else {
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      videoId = match ? match[1] : '';
    }
    if (videoId) {
      const autoplayParam = autoplay ? '&autoplay=1&muted=1' : '';
      return `https://player.vimeo.com/video/${videoId}?badge=0&title=0&byline=0${autoplayParam}`;
    }
  }
  
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

  const { data: relatedMovies } = useQuery<Movie[]>({
    queryKey: ["/api/movies/related", movieId, movie?.genres],
    queryFn: async () => {
      const response = await fetch(`/api/movies`);
      if (!response.ok) return [];
      const data = await response.json();
      const allMovies: Movie[] = data.movies || data;
      return allMovies
        .filter(m => m.id !== movieId && movie?.genres.some(g => m.genres.includes(g)))
        .slice(0, 10);
    },
    enabled: !!movie,
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

      {/* Hero Trailer Section */}
      <div className="pt-14 lg:pt-16">
        <div className="relative">
          {movie.trailerUrl ? (
            <div className="relative w-full aspect-video max-h-[70vh]">
              {movie.trailerUrl.toLowerCase().endsWith('.mp4') || movie.trailerUrl.toLowerCase().endsWith('.webm') ? (
                <video
                  src={movie.trailerUrl}
                  controls
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                  title={`${movie.title} Trailer`}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={getTrailerEmbedUrl(movie.trailerUrl, true)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={`${movie.title} Trailer`}
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="relative w-full aspect-video max-h-[70vh]">
              <img
                src={movie.backdropImage}
                alt={movie.title}
                className="w-full h-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <h1 className="text-4xl lg:text-6xl font-bold text-white drop-shadow-lg">{movie.title}</h1>
              </div>
            </div>
          )}
        </div>

        {/* Trailer Badge & Title Under Video */}
        <div className="px-4 lg:px-8 -mt-4 relative z-10">
          <div className="max-w-7xl mx-auto text-center">
            <Badge className="bg-red-600 text-white border-red-600 mb-2">
              <Play className="h-3 w-3 mr-1 fill-current" /> Trailer
            </Badge>
            <p className="text-sm text-muted-foreground">Watch the trailer for free</p>
          </div>
        </div>
      </div>

      {/* Movie Info Card */}
      <div className="px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg">
            <div className="flex flex-col lg:flex-row">
              {/* Poster */}
              <div className="lg:w-64 flex-shrink-0">
                <img
                  src={movie.posterImage}
                  alt={movie.title}
                  className="w-full h-72 lg:h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Info */}
              <div className="flex-1 p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left - Title & Description */}
                  <div className="flex-1">
                    <h1 className="text-2xl lg:text-3xl font-bold mb-3" data-testid="text-movie-title">
                      {movie.title}
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4" data-testid="text-description">
                      {movie.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Year:</span>
                        <span className="text-primary font-medium" data-testid="text-year">{movie.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Time:</span>
                        <span data-testid="text-duration">{movie.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Type:</span>
                        <span className="text-cyan-500">{movie.genres[0] || "Movie"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Rating:</span>
                        <Badge variant="outline" className="text-xs" data-testid="badge-rating">{movie.rating}</Badge>
                      </div>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {movie.genres.map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs" data-testid={`badge-genre-${genre.toLowerCase()}`}>
                          {genre}
                        </Badge>
                      ))}
                    </div>

                    {/* Cast Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Cast</h3>
                      <div className="flex flex-wrap gap-4">
                        {movie.cast.slice(0, 5).map((actor, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 text-center max-w-[60px] truncate" data-testid={`badge-actor-${index}`}>
                              {actor}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right - Action Buttons */}
                  <div className="lg:w-64 flex flex-col gap-3">
                    <Button
                      size="lg"
                      className="w-full gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                      onClick={handlePlayMovie}
                      data-testid="button-play"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      {movie.isFree === 1 ? "Watch Now" : "Buy Movie $1"}
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleAddToList}
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
                          Add to List
                        </>
                      )}
                    </Button>

                    {movie.isFree !== 1 && (
                      <p className="text-xs text-center text-muted-foreground">
                        Pay once, watch anytime
                      </p>
                    )}

                    {movie.isFree === 1 && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 justify-center" data-testid="badge-free">
                        FREE TO WATCH
                      </Badge>
                    )}

                    {/* Director */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">Director</p>
                      <p className="text-sm font-medium" data-testid="text-director">{movie.director}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Movies Section */}
      {relatedMovies && relatedMovies.length > 0 && (
        <div className="px-4 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Related Titles</h2>
              <Link href="/" className="text-sm text-primary flex items-center gap-1 hover:underline">
                More Films <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedMovies.map((relatedMovie) => (
                <Link key={relatedMovie.id} href={`/movie/${relatedMovie.id}`}>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                      <img
                        src={relatedMovie.posterImage}
                        alt={relatedMovie.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Play className="h-10 w-10 text-white" />
                      </div>
                      {relatedMovie.isFree === 1 && (
                        <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">
                          Free
                        </Badge>
                      )}
                      {relatedMovie.isFree !== 1 && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                          $1
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {relatedMovie.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{relatedMovie.year}</span>
                      <span>•</span>
                      <span>{relatedMovie.duration}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />

      {isPlayerOpen && (
        <VideoPlayer
          title={movie.title}
          videoUrl={secureVideoUrl || undefined}
          posterUrl={movie.backdropImage}
          onClose={() => {
            setIsPlayerOpen(false);
            setSecureVideoUrl(null);
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
