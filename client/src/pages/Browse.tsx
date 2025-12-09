import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import MovieCard from "@/components/MovieCard";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import MovieDetailModal from "@/components/MovieDetailModal";
import AuthModal from "@/components/AuthModal";
import { PaymentModal } from "@/components/PaymentModal";
import { Badge } from "@/components/ui/badge";
import { useMyList } from "@/hooks/use-my-list";
import { useVideoPurchaseGate } from "@/hooks/use-video-purchase";
import type { Movie } from "@shared/schema";

export default function Browse() {
  const [location] = useLocation();
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [pendingPlayMovie, setPendingPlayMovie] = useState<string | null>(null);
  const [pendingAddMovie, setPendingAddMovie] = useState<string | null>(null);
  const { toggleMyList } = useMyList();
  
  // Video purchase gate hook
  const {
    checkAndExecute: checkVideoPurchaseAndExecute,
    showPaymentModal,
    handlePaymentSuccess,
    handlePaymentCancel,
    currentMovieId,
    currentMovieTitle,
  } = useVideoPurchaseGate();

  // Check if user is authenticated
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch different data based on URL path
  const isMyList = location === "/my-list";
  const isNewAndPopular = location === "/new";
  
  const queryKey = isMyList 
    ? ["/api/my-list"] 
    : isNewAndPopular
    ? ["/api/movies/new-and-popular"]
    : ["/api/movies", { page: 1, limit: 1000 }];
    
  const apiUrl = isMyList
    ? "/api/my-list?page=1&limit=1000"
    : isNewAndPopular
    ? "/api/movies/new-and-popular?page=1&limit=1000"
    : "/api/movies?page=1&limit=1000";

  const { data: moviesData, isLoading } = useQuery<{ movies: Movie[], total: number }>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        if (response.status === 401 && isMyList) {
          // Not authenticated, return empty list
          return { movies: [], total: 0 };
        }
        throw new Error("Failed to fetch movies");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const allMovies = moviesData?.movies || [];

  const handlePlayMovie = (movieId: string) => {
    if (!user) {
      setPendingPlayMovie(movieId);
      setIsAuthModalOpen(true);
      return;
    }

    const movie = allMovies.find(m => m.id === movieId);
    if (!movie) return;

    checkVideoPurchaseAndExecute(movieId, movie.title, () => {
      setSelectedMovie(movie);
      setIsPlayerOpen(true);
    });
  };

  const handleAddToList = (movieId: string) => {
    if (!user) {
      setPendingAddMovie(movieId);
      setIsAuthModalOpen(true);
      return;
    }

    toggleMyList(movieId);
  };

  const handleShowDetails = (movieId: string) => {
    const movie = allMovies.find(m => m.id === movieId);
    if (movie) {
      setSelectedMovie(movie);
      setIsDetailModalOpen(true);
    }
  };

  const handleAuthSuccess = async () => {
    // Wait for user query to refetch after successful auth
    await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    
    // Now execute pending actions with fresh auth state
    if (pendingPlayMovie) {
      const movie = allMovies.find(m => m.id === pendingPlayMovie);
      if (movie) {
        checkVideoPurchaseAndExecute(pendingPlayMovie, movie.title, () => {
          setSelectedMovie(movie);
          setIsPlayerOpen(true);
        });
      }
      setPendingPlayMovie(null);
    }
    if (pendingAddMovie) {
      toggleMyList(pendingAddMovie);
      setPendingAddMovie(null);
    }
  };

  const handleLocalPaymentSuccess = () => {
    // After successful payment, execute pending action
    handlePaymentSuccess();
    
    // Play the selected movie
    if (selectedMovie) {
      setIsPlayerOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-16 px-4 lg:px-8 max-w-screen-2xl mx-auto">
          <div className="h-10 w-48 bg-muted/20 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="aspect-[16/9] bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allGenres = Array.from(
    new Set(allMovies.flatMap(movie => movie.genres))
  ).sort();
  const genres = ["All", ...allGenres];

  const filteredMovies = selectedGenre === "All"
    ? allMovies
    : allMovies.filter(movie => movie.genres.includes(selectedGenre));

  const pageTitle = isMyList ? "My List" : isNewAndPopular ? "New & Popular" : "Browse Movies";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-16 px-4 lg:px-8 max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6" data-testid="text-browse-title">{pageTitle}</h1>
          {!isMyList && (
            <div className="flex gap-2 overflow-x-auto pb-2" data-testid="section-genre-filters">
              {genres.map((genre) => (
                <Badge
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "secondary"}
                  className="cursor-pointer whitespace-nowrap hover-elevate"
                  onClick={() => setSelectedGenre(genre)}
                  data-testid={`badge-genre-filter-${genre.toLowerCase()}`}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {filteredMovies.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              {isMyList 
                ? "Your list is empty. Add movies to start building your collection!"
                : "No movies found"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="grid-browse-movies">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              image={movie.posterImage}
              rating={parseFloat(movie.rating)}
              year={movie.year}
              genres={movie.genres}
              onPlay={() => handlePlayMovie(movie.id)}
              onAddToList={() => handleAddToList(movie.id)}
              onShowDetails={() => handleShowDetails(movie.id)}
            />
          ))}
        </div>
      </div>

      <Footer />

      {isPlayerOpen && selectedMovie && (
        <VideoPlayer
          title={selectedMovie.title}
          videoUrl={selectedMovie.videoEmbedUrl || undefined}
          posterUrl={selectedMovie.backdropImage}
          onClose={() => setIsPlayerOpen(false)}
          user={user}
        />
      )}

      {isDetailModalOpen && selectedMovie && (
        <MovieDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          movie={{
            title: selectedMovie.title,
            image: selectedMovie.posterImage,
            backdropImage: selectedMovie.backdropImage,
            rating: parseFloat(selectedMovie.rating),
            year: selectedMovie.year,
            duration: selectedMovie.duration,
            genres: selectedMovie.genres,
            description: selectedMovie.description,
            cast: selectedMovie.cast,
            director: selectedMovie.director
          }}
          onPlay={() => {
            setIsDetailModalOpen(false);
            handlePlayMovie(selectedMovie.id);
          }}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingPlayMovie(null);
          setPendingAddMovie(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      <PaymentModal
        open={showPaymentModal}
        onOpenChange={(open) => {
          if (!open) handlePaymentCancel();
        }}
        onSuccess={handleLocalPaymentSuccess}
        mode="video"
        movieId={currentMovieId}
        movieTitle={currentMovieTitle}
      />
    </div>
  );
}
