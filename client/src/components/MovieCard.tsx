import { Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { movieCardLabels } from "@/lib/translations";

interface MovieCardProps {
  id: string;
  title: string;
  image: string;
  rating: number;
  year: number;
  genres: string[];
  onPlay?: () => void;
  onAddToList?: () => void;
  onShowDetails?: () => void;
}

export default function MovieCard({
  title,
  image,
  rating,
  year,
  genres,
  onPlay,
  onAddToList,
  onShowDetails,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { language } = useLanguage();
  const t = movieCardLabels;

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay?.()}
      data-testid={`card-movie-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Poster image with portrait aspect ratio */}
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg">
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-300 ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        />
        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Movie info - shown on hover */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-2 sm:p-3 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <h3 className="font-semibold text-xs sm:text-sm md:text-base mb-1 line-clamp-2" data-testid={`text-movie-title-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {title}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2" data-testid="badge-rating">
            {rating}/10
          </Badge>
          <span data-testid="text-year">{year}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 mb-2">
          {genres.slice(0, 2).map((genre) => (
            <Badge key={genre} variant="outline" className="text-[10px] px-1" data-testid={`badge-genre-${genre.toLowerCase()}`}>
              {genre}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            data-testid="button-play"
          >
            <Play className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{t.play[language]}</span>
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={(e) => {
              e.stopPropagation();
              onAddToList?.();
            }}
            data-testid="button-add-to-list"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Title below card (always visible) */}
      <div className="mt-2 px-1">
        <h4 className="text-xs sm:text-sm font-medium line-clamp-1 text-foreground/90">{title}</h4>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{year}</p>
      </div>
    </div>
  );
}
