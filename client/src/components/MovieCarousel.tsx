import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import MovieCard from "./MovieCard";
import { useRef, useState, useEffect } from "react";

interface Movie {
  id: string;
  title: string;
  image: string;
  rating: number;
  year: number;
  genres: string[];
}

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  onPlayMovie?: (movieId: string) => void;
  onAddToList?: (movieId: string) => void;
  onShowDetails?: (movieId: string) => void;
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

export default function MovieCarousel({ 
  title, 
  movies, 
  onPlayMovie, 
  onAddToList, 
  onShowDetails,
  autoSlide = false,
  autoSlideInterval = 4000
}: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(() => checkArrows(), 300);
    }
  };

  const checkArrows = () => {
    if (scrollRef.current) {
      setShowLeftArrow(scrollRef.current.scrollLeft > 0);
      setShowRightArrow(
        scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
      );
    }
  };

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || !scrollRef.current || isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const isAtEnd = scrollRef.current.scrollLeft >= 
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10;

        if (isAtEnd) {
          // Reset to start
          scrollRef.current.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        } else {
          // Scroll to next
          scroll("right");
        }
      }
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, autoSlideInterval, isHovered]);

  return (
    <div 
      className="relative group" 
      data-testid={`carousel-${title.toLowerCase().replace(/\s+/g, "-")}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 className="text-2xl font-semibold mb-4 px-4 lg:px-8" data-testid="text-carousel-title">
        {title}
      </h2>
      <div className="relative px-4 lg:px-8">
        {showLeftArrow && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("left")}
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          onScroll={checkArrows}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="flex-none w-72">
              <MovieCard
                {...movie}
                onPlay={() => onPlayMovie?.(movie.id)}
                onAddToList={() => onAddToList?.(movie.id)}
                onShowDetails={() => onShowDetails?.(movie.id)}
              />
            </div>
          ))}
        </div>

        {showRightArrow && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("right")}
            data-testid="button-scroll-right"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
