import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import MovieDetailModal from "@/components/MovieDetailModal";
import AuthModal from "@/components/AuthModal";
import { PaymentModal } from "@/components/PaymentModal";
import { useMyList } from "@/hooks/use-my-list";
import { useVideoPurchaseGate, useVideoPurchase } from "@/hooks/use-video-purchase";
import { Button } from "@/components/ui/button";
import { ChevronDown, Play, Plus } from "lucide-react";
import type { Movie } from "@shared/schema";
import { countryMapping } from "@shared/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { genres as genresTranslation, ratings as ratingsTranslation, years as yearsTranslation, countries as countriesTranslation, filterLabels, paginationLabels } from "@/lib/translations";

export default function Home() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [pendingPlayMovie, setPendingPlayMovie] = useState<string | null>(null);
  const [pendingAddMovie, setPendingAddMovie] = useState<string | null>(null);
  const [selectedGenreIndex, setSelectedGenreIndex] = useState<number>(0);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [selectedRatingIndex, setSelectedRatingIndex] = useState<number>(0);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(0);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number>(0);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Load Khmer font and set language attribute when component mounts
  useEffect(() => {
    // Set lang attribute on html element for proper font rendering
    document.documentElement.lang = language === 'kh' ? 'km' : 'en';
  }, [language]);

  const genres = genresTranslation[language];
  const ratings = ratingsTranslation[language];
  const years = yearsTranslation[language];
  const countries = countriesTranslation[language];

  const selectedGenre = genres[selectedGenreIndex] || genres[0];
  const selectedRating = ratings[selectedRatingIndex] || ratings[0];
  const selectedYear = years[selectedYearIndex] || years[0];
  const selectedCountry = countries[selectedCountryIndex] || countries[0];

  const selectedGenreEnglish = genresTranslation.en[selectedGenreIndex] || "All";
  const selectedRatingEnglish = ratingsTranslation.en[selectedRatingIndex] || "All";
  const selectedYearEnglish = yearsTranslation.en[selectedYearIndex] || "All";
  const selectedCountryEnglish = countriesTranslation.en[selectedCountryIndex] || "All";

  // My List hook
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

  // Check if selected movie is purchased
  const { isPurchased: isSelectedMoviePurchased } = useVideoPurchase(selectedMovie?.id || null);

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

  // Fetch movies based on selected genre
  const getEndpoint = () => {
    if (selectedGenreEnglish === "All") return "/api/movies";
    return `/api/movies/genre/${encodeURIComponent(selectedGenreEnglish)}`;
  };

  const { data: moviesData, isLoading, isFetching } = useQuery<{ movies: Movie[], total: number }>({
    queryKey: [getEndpoint(), { page: currentPage, limit: 30 }],
    queryFn: async () => {
      const response = await fetch(`${getEndpoint()}?page=${currentPage}&limit=30`);
      if (!response.ok) throw new Error("Failed to fetch movies");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const movies = moviesData?.movies || [];
  const total = moviesData?.total || 0;
  const totalPages = Math.ceil(total / 30);

  // Apply client-side filters for rating, year, and country (only on current page)
  const filteredMovies = movies.filter(movie => {
    // Rating filter using English values
    if (selectedRatingEnglish !== "All") {
      const movieRating = parseFloat(movie.rating);
      if (selectedRatingEnglish === "9+") {
        if (movieRating < 9) return false;
      } else if (selectedRatingEnglish === "8-9") {
        if (movieRating < 8 || movieRating >= 9) return false;
      } else if (selectedRatingEnglish === "7-8") {
        if (movieRating < 7 || movieRating >= 8) return false;
      } else if (selectedRatingEnglish === "6-7") {
        if (movieRating < 6 || movieRating >= 7) return false;
      } else if (selectedRatingEnglish === "Below 6") {
        if (movieRating >= 6) return false;
      }
    }

    // Year filter using English values
    if (selectedYearEnglish !== "All") {
      const movieYear = movie.year;
      if (selectedYearEnglish === "2024+") {
        if (movieYear < 2024) return false;
      } else if (selectedYearEnglish === "2020-2023") {
        if (movieYear < 2020 || movieYear > 2023) return false;
      } else if (selectedYearEnglish === "2010-2019") {
        if (movieYear < 2010 || movieYear > 2019) return false;
      } else if (selectedYearEnglish === "2000-2009") {
        if (movieYear < 2000 || movieYear > 2009) return false;
      } else if (selectedYearEnglish === "Before 2000") {
        if (movieYear >= 2000) return false;
      }
    }

    // Country filter using English values
    if (selectedCountryEnglish !== "All") {
      if (movie.country !== selectedCountryEnglish) return false;
    }

    return true;
  });

  const displayCount = filteredMovies.length;

  // Reset to page 1 when genre changes
  const handleGenreChange = (index: number) => {
    setSelectedGenreIndex(index);
    setCurrentPage(1);
    setIsGenreDropdownOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-14 lg:pt-16">
          <div className="border-b border-border">
            <div className="h-14 bg-muted/10 animate-pulse" />
          </div>
          <div className="p-4 lg:p-12">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 lg:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="aspect-[2/3] bg-muted/20 rounded-md animate-pulse border-[3px] border-white" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePlayMovie = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

  const handleAddToList = (movieId: string) => {
    if (!user) {
      setPendingAddMovie(movieId);
      setIsAuthModalOpen(true);
      return;
    }
    toggleMyList(movieId);
  };

  const handleAuthSuccess = async () => {
    await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    if (pendingPlayMovie) {
      navigate(`/movie/${pendingPlayMovie}`);
      setPendingPlayMovie(null);
    }
    if (pendingAddMovie) {
      toggleMyList(pendingAddMovie);
      setPendingAddMovie(null);
    }
  };

  const handleShowDetails = (movieId: string) => {
    const movie = movies.find(m => m.id === movieId);
    if (movie) {
      setSelectedMovie(movie);
      setIsDetailModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Filters */}
      <div className="pt-14 lg:pt-16 border-b border-border">
        <div className="px-4 lg:px-12 py-4 lg:py-6">
          <div className="flex flex-col items-center gap-4">
            {/* Centered Filter Box */}
            <div className="w-full max-w-4xl mx-auto bg-secondary/30 border border-border rounded-lg px-3 lg:px-4 py-3 shadow-sm">
              <div className="flex items-center justify-center gap-2 lg:gap-6 flex-wrap">
                {/* Genre Filter */}
                <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                  <span className="text-sm lg:text-base text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {filterLabels.genre[language]}
                  </span>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 hover-elevate min-w-[70px] max-w-[110px] h-9 px-2 lg:px-3"
                      onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                      data-testid="button-genre-filter"
                    >
                      <span className="text-sm lg:text-base truncate block">{selectedGenre}</span>
                      <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                    </Button>
                    {isGenreDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg min-w-[160px] max-h-[400px] overflow-y-auto z-50">
                        {genres.map((genre, index) => (
                          <button
                            key={genre}
                            className="w-full text-left px-4 py-2 text-base hover:bg-accent/50 first:rounded-t-md last:rounded-b-md transition-colors whitespace-nowrap"
                            onClick={() => handleGenreChange(index)}
                            data-testid={`button-genre-${genresTranslation.en[index].toLowerCase().replace(' ', '-')}`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                  <span className="text-sm lg:text-base text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {filterLabels.rating[language]}
                  </span>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 hover-elevate min-w-[60px] max-w-[90px] h-9 px-2 lg:px-3"
                      onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
                      data-testid="button-rating-filter"
                    >
                      <span className="text-sm lg:text-base truncate block">{selectedRating}</span>
                      <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                    </Button>
                    {isRatingDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg min-w-[140px] z-50">
                        {ratings.map((rating, index) => (
                          <button
                            key={rating}
                            className="w-full text-left px-4 py-2 text-base hover:bg-accent/50 first:rounded-t-md last:rounded-b-md transition-colors whitespace-nowrap"
                            onClick={() => {
                              setSelectedRatingIndex(index);
                              setCurrentPage(1);
                              setIsRatingDropdownOpen(false);
                            }}
                            data-testid={`button-rating-${ratingsTranslation.en[index].toLowerCase().replace(/\+| /g, '-')}`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                  <span className="text-sm lg:text-base text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {filterLabels.year[language]}
                  </span>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 hover-elevate min-w-[70px] max-w-[110px] h-9 px-2 lg:px-3"
                      onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                      data-testid="button-year-filter"
                    >
                      <span className="text-sm lg:text-base truncate block">{selectedYear}</span>
                      <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                    </Button>
                    {isYearDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg min-w-[160px] z-50">
                        {years.map((year, index) => (
                          <button
                            key={year}
                            className="w-full text-left px-4 py-2 text-base hover:bg-accent/50 first:rounded-t-md last:rounded-b-md transition-colors whitespace-nowrap"
                            onClick={() => {
                              setSelectedYearIndex(index);
                              setCurrentPage(1);
                              setIsYearDropdownOpen(false);
                            }}
                            data-testid={`button-year-${yearsTranslation.en[index].toLowerCase().replace(/\+| /g, '-')}`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Country Filter */}
                <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                  <span className="text-sm lg:text-base text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {filterLabels.country[language]}
                  </span>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 hover-elevate min-w-[70px] max-w-[110px] h-9 px-2 lg:px-3"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      data-testid="button-country-filter"
                    >
                      <span className="text-sm lg:text-base truncate block">{selectedCountry}</span>
                      <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                    </Button>
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg min-w-[160px] max-h-[400px] overflow-y-auto z-50">
                        {countries.map((country, index) => (
                          <button
                            key={country}
                            className="w-full text-left px-4 py-2 text-base hover:bg-accent/50 first:rounded-t-md last:rounded-b-md transition-colors whitespace-nowrap"
                            onClick={() => {
                              setSelectedCountryIndex(index);
                              setCurrentPage(1);
                              setIsCountryDropdownOpen(false);
                            }}
                            data-testid={`button-country-${countriesTranslation.en[index].toLowerCase().replace(/ /g, '-')}`}
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Movie count */}
            <span className="text-base text-muted-foreground" data-testid="text-movie-count">
              <span className="hidden sm:inline">{paginationLabels.showing[language]} </span>{displayCount}<span className="hidden sm:inline"> {paginationLabels.of[language]} {total}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="p-4 lg:p-12">
        {/* Pagination Controls - Top */}
        {total > 30 && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              data-testid="button-prev-page-top"
              className="hover-elevate text-sm lg:text-base"
            >
              {paginationLabels.previous[language]}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    data-testid={`button-page-${pageNumber}-top`}
                    className="w-9 lg:w-11 hover-elevate text-sm lg:text-base"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              data-testid="button-next-page-top"
              className="hover-elevate text-sm lg:text-base"
            >
              {paginationLabels.next[language]}
            </Button>
          </div>
        )}

        {isFetching && (
          <div className="mb-4 text-center text-base text-muted-foreground">
            Loading...
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 lg:gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="group cursor-pointer"
              data-testid={`card-movie-${movie.id}`}
            >
              <div
                className="relative aspect-[2/3] rounded-md overflow-hidden bg-card border-[3px] border-white"
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <img
                  src={movie.posterImage}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect fill="%23333" width="200" height="300"/><text x="100" y="150" text-anchor="middle" fill="%23888" font-size="14" font-family="sans-serif">No Image</text></svg>';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 rounded-full backdrop-blur-sm bg-background/80 hover-elevate"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayMovie(movie.id);
                    }}
                    data-testid={`button-play-${movie.id}`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 rounded-full backdrop-blur-sm bg-background/80 hover-elevate"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToList(movie.id);
                    }}
                    data-testid={`button-add-to-list-${movie.id}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-sm lg:text-base font-medium truncate" data-testid={`text-title-${movie.id}`}>
                  {movie.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-year-${movie.id}`}>
                  {movie.year}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls - Bottom */}
        {total > 30 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              data-testid="button-prev-page"
              className="hover-elevate text-sm lg:text-base"
            >
              {paginationLabels.previous[language]}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    data-testid={`button-page-${pageNumber}`}
                    className="w-9 lg:w-11 hover-elevate text-sm lg:text-base"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              data-testid="button-next-page"
              className="hover-elevate text-sm lg:text-base"
            >
              {paginationLabels.next[language]}
            </Button>
          </div>
        )}
      </div>

      <Footer />

      {isPlayerOpen && selectedMovie && (
        <VideoPlayer
          title={selectedMovie.title}
          videoUrl={selectedMovie.videoEmbedUrl || undefined}
          posterUrl={selectedMovie.backdropImage}
          onClose={() => setIsPlayerOpen(false)}
          user={user}
          hasPurchased={isSelectedMoviePurchased}
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
        onOpenChange={handlePaymentCancel}
        onSuccess={handlePaymentSuccess}
        mode="video"
        movieId={currentMovieId}
        movieTitle={currentMovieTitle}
      />

      {/* Click outside to close dropdowns */}
      {(isGenreDropdownOpen || isRatingDropdownOpen || isYearDropdownOpen || isCountryDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsGenreDropdownOpen(false);
            setIsRatingDropdownOpen(false);
            setIsYearDropdownOpen(false);
            setIsCountryDropdownOpen(false);
          }}
        />
      )}
    </div>
  );
}