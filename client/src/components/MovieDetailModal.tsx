import { X, Play, Plus, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { movieModalLabels } from "@/lib/translations";
import adBanner1 from "@assets/TAPTAP2-728x180-3_1764365836520.gif";
import adBanner2 from "@assets/DAFABET-728x180-1_1764365836521.gif";

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: {
    title: string;
    image: string;
    backdropImage: string;
    rating: number;
    year: number;
    duration: string;
    genres: string[];
    description: string;
    cast: string[];
    director: string;
  };
  onPlay?: () => void;
}

export default function MovieDetailModal({ isOpen, onClose, movie, onPlay }: MovieDetailModalProps) {
  const { language } = useLanguage();
  const t = movieModalLabels;

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
            <span className="text-xs text-muted-foreground" data-testid="text-modal-year">{movie.year}</span>
            <span className="text-xs text-muted-foreground" data-testid="text-modal-duration">{movie.duration}</span>
            {movie.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs" data-testid={`badge-modal-genre-${genre.toLowerCase()}`}>
                {genre}
              </Badge>
            ))}
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
