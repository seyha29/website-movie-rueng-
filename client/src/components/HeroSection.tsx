import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
  title: string;
  description: string;
  backgroundImage: string;
  rating: number;
  year: number;
  duration: string;
  genres: string[];
  onPlay?: () => void;
}

export default function HeroSection({
  title,
  description,
  backgroundImage,
  rating,
  year,
  duration,
  genres,
  onPlay,
}: HeroSectionProps) {
  return (
    <div className="relative min-h-[70vh] sm:min-h-[85vh] flex items-end" data-testid="section-hero">
      <img
        src={backgroundImage}
        alt={title}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      </div>

      <div className="relative max-w-screen-2xl mx-auto w-full px-3 sm:px-4 lg:px-8 pb-12 sm:pb-16 lg:pb-24">
        <div className="max-w-2xl space-y-3 sm:space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight" data-testid="text-hero-title">
            {title}
          </h1>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Badge className="text-xs sm:text-sm" data-testid="badge-hero-rating">
              {rating}/10
            </Badge>
            <span className="text-xs sm:text-sm text-muted-foreground" data-testid="text-hero-year">{year}</span>
            <span className="text-xs sm:text-sm text-muted-foreground" data-testid="text-hero-duration">{duration}</span>
            {genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs sm:text-sm" data-testid={`badge-hero-genre-${genre.toLowerCase()}`}>
                {genre}
              </Badge>
            ))}
          </div>

          <p className="text-sm sm:text-lg leading-relaxed text-foreground/90 line-clamp-2 sm:line-clamp-3" data-testid="text-hero-description">
            {description}
          </p>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button size="sm" className="gap-2 text-xs sm:text-sm sm:min-h-10" onClick={onPlay} data-testid="button-hero-play">
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
              Play Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
