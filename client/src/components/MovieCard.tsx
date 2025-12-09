import { Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay?.()}
      data-testid={`card-movie-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="aspect-[16/9] rounded-md overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-300 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <h3 className="font-semibold text-lg mb-2 line-clamp-1" data-testid={`text-movie-title-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {title}
        </h3>
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs" data-testid="badge-rating">
            {rating}/10
          </Badge>
          <span data-testid="text-year">{year}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          {genres.slice(0, 2).map((genre) => (
            <Badge key={genre} variant="outline" className="text-xs" data-testid={`badge-genre-${genre.toLowerCase()}`}>
              {genre}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            data-testid="button-play"
          >
            <Play className="h-3 w-3 mr-1" />
            Play
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onAddToList?.();
            }}
            data-testid="button-add-to-list"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
