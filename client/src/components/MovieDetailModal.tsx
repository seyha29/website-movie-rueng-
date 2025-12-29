import { useState, useEffect } from "react";
import { X, Play, Plus, ThumbsUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { movieModalLabels } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import adBanner1 from "@assets/TAPTAP2-728x180-3_1764365836520.gif";
import adBanner2 from "@assets/DAFABET-728x180-1_1764365836521.gif";

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: {
    id: string;
    title: string;
    image: string;
    backdropImage: string;
    rating: number;
    imdbRating?: string | null;
    tmdbRating?: string | null;
    userRatingAvg?: string | null;
    userRatingCount?: number;
    year: number;
    duration: string;
    genres: string[];
    description: string;
    cast: string[];
    director: string;
  };
  onPlay?: () => void;
}

const ratingLabels: Record<string, { en: string; km: string }> = {
  rate: { en: "Rate this movie", km: "វាយតម្លៃភាពយន្តនេះ" },
  yourRating: { en: "Your Rating", km: "ការវាយតម្លៃរបស់អ្នក" },
  userRating: { en: "User Rating", km: "ការវាយតម្លៃអ្នកប្រើ" },
  votes: { en: "votes", km: "សម្លេង" },
  loginToRate: { en: "Login to rate", km: "ចូលដើម្បីវាយតម្លៃ" },
};

export default function MovieDetailModal({ isOpen, onClose, movie, onPlay }: MovieDetailModalProps) {
  const { language } = useLanguage();
  const t = movieModalLabels;
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
  });
  const isAuthenticated = !!user;
  
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(Number(movie.userRatingAvg) || 0);
  const [ratingCount, setRatingCount] = useState<number>(movie.userRatingCount || 0);

  useEffect(() => {
    if (isOpen && isAuthenticated && movie.id) {
      apiRequest("GET", `/api/movies/${movie.id}/my-rating`)
        .then(res => res.json())
        .then(data => {
          if (data.rating !== null) {
            setUserRating(data.rating);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, isAuthenticated, movie.id]);

  useEffect(() => {
    setAvgRating(Number(movie.userRatingAvg) || 0);
    setRatingCount(movie.userRatingCount || 0);
  }, [movie.userRatingAvg, movie.userRatingCount]);

  const handleRatingClick = async (score: number) => {
    if (!isAuthenticated || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/movies/${movie.id}/rate`, { score });
      const data = await res.json();
      if (data.success) {
        setUserRating(data.rating);
        setAvgRating(data.averageRating);
        setRatingCount(data.totalRatings);
      }
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || userRating || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-card overflow-hidden max-h-[90vh] overflow-y-auto" data-testid="modal-movie-detail">
        <a 
          href="https://taptapthai.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full"
          data-testid="link-ad-banner-1"
        >
          <img 
            src={adBanner1} 
            alt="Advertisement" 
            className="w-full h-auto object-cover"
            data-testid="img-ad-banner-1"
          />
        </a>

        <div className="relative">
          <div
            className="w-full h-48 sm:h-56 bg-cover bg-center"
            style={{ backgroundImage: `url(${movie.backdropImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm"
            onClick={onClose}
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-modal-title">{movie.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={onPlay} data-testid="button-modal-play">
                <Play className="h-4 w-4 mr-1" />
                {t.play[language]}
              </Button>
              <Button size="sm" variant="secondary" data-testid="button-modal-add-list">
                <Plus className="h-4 w-4 mr-1" />
                {t.myList[language]}
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8" data-testid="button-modal-like">
                <ThumbsUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogHeader className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="text-xs" data-testid="badge-modal-rating">{movie.rating}/10</Badge>
            {movie.imdbRating && (
              <Badge className="text-xs bg-yellow-600 hover:bg-yellow-700" data-testid="badge-modal-imdb-rating">
                IMDb {movie.imdbRating}
              </Badge>
            )}
            {movie.tmdbRating && (
              <Badge className="text-xs bg-blue-600 hover:bg-blue-700" data-testid="badge-modal-tmdb-rating">
                TMDb {movie.tmdbRating}
              </Badge>
            )}
            {avgRating > 0 && (
              <Badge className="text-xs bg-green-600 hover:bg-green-700" data-testid="badge-modal-user-rating">
                {ratingLabels.userRating[language]} {avgRating.toFixed(1)}/10 ({ratingCount} {ratingLabels.votes[language]})
              </Badge>
            )}
            <span className="text-xs text-muted-foreground" data-testid="text-modal-year">{movie.year}</span>
            <span className="text-xs text-muted-foreground" data-testid="text-modal-duration">{movie.duration}</span>
            {movie.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs" data-testid={`badge-modal-genre-${genre.toLowerCase()}`}>
                {genre}
              </Badge>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-3" data-testid="container-user-rating">
            <p className="text-xs font-medium mb-2">
              {userRating ? ratingLabels.yourRating[language] : ratingLabels.rate[language]}
              {!isAuthenticated && <span className="text-muted-foreground ml-2">({ratingLabels.loginToRate[language]})</span>}
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  disabled={!isAuthenticated || isSubmitting}
                  onClick={() => handleRatingClick(score)}
                  onMouseEnter={() => isAuthenticated && setHoveredRating(score)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className={`p-0.5 transition-colors ${
                    isAuthenticated ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'
                  }`}
                  data-testid={`button-rate-${score}`}
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      score <= displayRating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-2 text-sm font-semibold text-yellow-400">{displayRating}/10</span>
              )}
            </div>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4" data-testid="text-modal-description">
            {movie.description}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-1" data-testid="text-modal-cast-label">{t.cast[language]}</h3>
              <p className="text-xs line-clamp-2" data-testid="text-modal-cast">{movie.cast.join(", ")}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-1" data-testid="text-modal-director-label">{t.director[language]}</h3>
              <p className="text-xs" data-testid="text-modal-director">{movie.director}</p>
            </div>
          </div>
        </DialogHeader>

        <a 
          href="https://dafabet.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full"
          data-testid="link-ad-banner-2"
        >
          <img 
            src={adBanner2} 
            alt="Advertisement" 
            className="w-full h-auto object-cover"
            data-testid="img-ad-banner-2"
          />
        </a>
      </DialogContent>
    </Dialog>
  );
}
