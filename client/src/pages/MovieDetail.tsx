import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import AuthModal from "@/components/AuthModal";
import { PaymentModal } from "@/components/PaymentModal";
import { useMyList } from "@/hooks/use-my-list";
import { useVideoPurchaseGate, useVideoPurchase } from "@/hooks/use-video-purchase";
import { useLanguage } from "@/contexts/LanguageContext";
import { movieDetailLabels } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Check, ChevronLeft, Clock, Calendar, Film, Star, User, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Movie, AdBanner } from "@shared/schema";

function getTrailerEmbedUrl(url: string, autoplay: boolean = true): string {
  if (!url) return "";
  
  const autoplayParams = autoplay ? 'autoplay=1&mute=1' : '';
  
  // If already a YouTube embed URL, just add parameters
  if (url.includes('youtube.com/embed/')) {
    const hasParams = url.includes('?');
    if (hasParams) {
      return `${url}&${autoplayParams}&rel=0&modestbranding=1&enablejsapi=1`;
    }
    return `${url}?${autoplayParams}&rel=0&modestbranding=1&enablejsapi=1`;
  }
  
  // Handle other YouTube URL formats
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    
    if (url.includes('/shorts/')) {
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
      return `https://www.youtube.com/embed/${videoId}?${autoplayParams}&rel=0&modestbranding=1&enablejsapi=1`;
    }
  }
  
  // If already a Vimeo player URL, just add parameters
  if (url.includes('player.vimeo.com/video/')) {
    const hasParams = url.includes('?');
    const vimeoAutoplay = autoplay ? 'autoplay=1&muted=1' : '';
    if (hasParams) {
      return `${url}&${vimeoAutoplay}&badge=0&title=0&byline=0`;
    }
    return `${url}?${vimeoAutoplay}&badge=0&title=0&byline=0`;
  }
  
  // Handle other Vimeo URL formats
  if (url.includes('vimeo.com')) {
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const match = url.match(vimeoRegex);
    const videoId = match ? match[1] : '';
    if (videoId) {
      const vimeoAutoplay = autoplay ? 'autoplay=1&muted=1' : '';
      return `https://player.vimeo.com/video/${videoId}?${vimeoAutoplay}&badge=0&title=0&byline=0`;
    }
  }
  
  return url;
}

export default function MovieDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const movieId = params.id;
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: keyof typeof movieDetailLabels) => movieDetailLabels[key][language];
  
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"play" | "add" | null>(null);
  const [secureVideoUrl, setSecureVideoUrl] = useState<string | null>(null);
  
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  
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
    currentMoviePrice,
  } = useVideoPurchaseGate();

  // Check if this movie is already purchased
  const { isPurchased } = useVideoPurchase(movieId || null);

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

  const { data: activeBanners } = useQuery<AdBanner[]>({
    queryKey: ["/api/banners/active"],
    queryFn: async () => {
      const response = await fetch("/api/banners/active");
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (movie) {
      setAvgRating(Number(movie.userRatingAvg) || 0);
      setRatingCount(movie.userRatingCount || 0);
    }
  }, [movie]);

  useEffect(() => {
    if (user && movieId) {
      apiRequest("GET", `/api/movies/${movieId}/my-rating`)
        .then(res => res.json())
        .then(data => {
          if (data.rating !== null) {
            setUserRating(data.rating);
          }
        })
        .catch(() => {});
    }
  }, [user, movieId]);

  const handleRatingClick = async (score: number) => {
    if (!user || isSubmittingRating || !movieId) return;
    
    setIsSubmittingRating(true);
    try {
      const res = await apiRequest("POST", `/api/movies/${movieId}/rate`, { score });
      const data = await res.json();
      if (data.success) {
        setUserRating(data.rating);
        setAvgRating(data.averageRating);
        setRatingCount(data.totalRatings);
        toast({
          title: language === 'km' ? "ជោគជ័យ" : "Success",
          description: language === 'km' ? "បានវាយតម្លៃភាពយន្ត" : "Movie rated successfully",
        });
      }
    } catch (error) {
      toast({
        title: language === 'km' ? "បរាជ័យ" : "Error",
        description: language === 'km' ? "មិនអាចវាយតម្លៃបាន" : "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const displayRating = hoveredRating || userRating || 0;

  const handlePlayMovie = () => {
    if (!user) {
      // Store the movie ID and action for after login
      sessionStorage.setItem('pendingMovieId', movieId || '');
      sessionStorage.setItem('pendingMovieAction', 'play');
      navigate('/login');
      return;
    }

    if (!movie) return;

    checkVideoPurchaseAndExecute(movie.id, movie.title, async () => {
      const videoUrl = await fetchSecureVideoUrl(movie.id);
      if (videoUrl) {
        setSecureVideoUrl(videoUrl);
        setIsPlayerOpen(true);
      }
    }, movie.price || "1.00");
  };

  const handleAddToList = () => {
    if (!user) {
      // Store the movie ID and action for after login
      sessionStorage.setItem('pendingMovieId', movieId || '');
      sessionStorage.setItem('pendingMovieAction', 'add');
      navigate('/login');
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
          <h1 className="text-2xl font-bold mb-4">{t("movieNotFound")}</h1>
          <Button onClick={() => navigate("/")}>{t("goHome")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Admin Banners Above Trailer */}
      {activeBanners && activeBanners.length > 0 && (
        <div className="pt-14 lg:pt-16 flex flex-col items-center" style={{ gap: '1px' }}>
          {activeBanners.slice(0, 2).map((banner) => (
            <a
              key={banner.id}
              href={banner.linkUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              style={{ width: '90%' }}
            >
              <img
                src={banner.imageUrl}
                alt={banner.name}
                className="w-full h-auto object-cover"
                style={{ maxHeight: '120px' }}
              />
            </a>
          ))}
        </div>
      )}

      {/* Hero Trailer Section */}
      <div className={activeBanners && activeBanners.length > 0 ? "" : "pt-14 lg:pt-16"}>
        <div className="relative flex justify-center" style={{ paddingTop: '2px' }}>
          {movie.trailerUrl ? (
            <div className="relative" style={{ width: '90%', aspectRatio: '16/9' }}>
              {movie.trailerUrl.toLowerCase().endsWith('.mp4') || movie.trailerUrl.toLowerCase().endsWith('.webm') ? (
                <video
                  src={movie.trailerUrl}
                  controls
                  autoPlay
                  muted
                  className="w-full h-full object-contain bg-black"
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
            </div>
          ) : (
            <div className="relative aspect-video max-h-[70vh]" style={{ width: '90%' }}>
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
              <Play className="h-3 w-3 mr-1 fill-current" /> {t("trailer")}
            </Badge>
            <p className="text-sm text-muted-foreground">{t("watchTrailerFree")}</p>
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
                        <span className="text-muted-foreground">{t("year")}</span>
                        <span className="text-primary font-medium" data-testid="text-year">{movie.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("duration")}</span>
                        <span data-testid="text-duration">{movie.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("type")}</span>
                        <span className="text-cyan-500">{movie.genres[0] || t("movie")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("rating")}</span>
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

                    {/* Rating Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {movie.imdbRating && (
                        <Badge className="text-xs bg-yellow-600 hover:bg-yellow-700" data-testid="badge-imdb-rating">
                          IMDb {movie.imdbRating}
                        </Badge>
                      )}
                      {movie.tmdbRating && (
                        <Badge className="text-xs bg-blue-600 hover:bg-blue-700" data-testid="badge-tmdb-rating">
                          TMDb {movie.tmdbRating}
                        </Badge>
                      )}
                      {avgRating > 0 && (
                        <Badge className="text-xs bg-green-600 hover:bg-green-700" data-testid="badge-user-rating">
                          {language === 'km' ? 'អ្នកប្រើ' : 'Users'} {avgRating.toFixed(1)}/10 ({ratingCount} {language === 'km' ? 'សម្លេង' : 'votes'})
                        </Badge>
                      )}
                    </div>

                    {/* User Rating Section */}
                    <div className="bg-muted/50 rounded-lg p-4 mb-4" data-testid="container-user-rating">
                      <p className="text-sm font-medium mb-2">
                        {userRating 
                          ? (language === 'km' ? 'ការវាយតម្លៃរបស់អ្នក' : 'Your Rating')
                          : (language === 'km' ? 'វាយតម្លៃភាពយន្តនេះ' : 'Rate this movie')}
                        {!user && <span className="text-muted-foreground ml-2">({language === 'km' ? 'ចូលដើម្បីវាយតម្លៃ' : 'Login to rate'})</span>}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            disabled={!user || isSubmittingRating}
                            onClick={() => handleRatingClick(score)}
                            onMouseEnter={() => user && setHoveredRating(score)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className={`p-0.5 transition-all ${
                              user ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'
                            }`}
                            data-testid={`button-rate-${score}`}
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${
                                score <= displayRating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-400'
                              }`}
                            />
                          </button>
                        ))}
                        {displayRating > 0 && (
                          <span className="ml-3 text-lg font-semibold text-yellow-400">{displayRating}/10</span>
                        )}
                      </div>
                    </div>

                    {/* Cast Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("cast")}</h3>
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
                      {movie.isFree === 1 || isPurchased ? t("watchNow") : `${t("buyMovie")} $${movie.price || "1.00"}`}
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
                          {t("inMyList")}
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          {t("addToList")}
                        </>
                      )}
                    </Button>

                    {movie.isFree !== 1 && !isPurchased && (
                      <p className="text-xs text-center text-muted-foreground">
                        {t("payOnceWatchAnytime")}
                      </p>
                    )}

                    {isPurchased && (
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 justify-center">
                        {t("Purchased")}
                      </Badge>
                    )}

                    {movie.isFree === 1 && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 justify-center" data-testid="badge-free">
                        {t("freeToWatch")}
                      </Badge>
                    )}

                    {/* Director */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">{t("director")}</p>
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
              <h2 className="text-xl font-bold">{t("relatedTitles")}</h2>
              <Link href="/" className="text-sm text-primary flex items-center gap-1 hover:underline">
                {t("moreFilms")} <ChevronRight className="h-4 w-4" />
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
                          ${relatedMovie.price || "1.00"}
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
          hasPurchased={true}
          userId={user?.id}
          isTrusted={user?.trustedUser === 1}
          noWatermark={user?.noWatermark === 1}
          movieId={movie.id}
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
        moviePrice={currentMoviePrice}
      />
    </div>
  );
}
