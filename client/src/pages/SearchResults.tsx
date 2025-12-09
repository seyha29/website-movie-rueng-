import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import MovieCard from "@/components/MovieCard";
import Footer from "@/components/Footer";
import type { Movie } from "@shared/schema";

export default function SearchResults() {
  const [, params] = useRoute("/search/:query");
  const searchQuery = params?.query ? decodeURIComponent(params.query) : "";

  const { data: searchData, isLoading } = useQuery<{ movies: Movie[], total: number }>({
    queryKey: ["/api/movies/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return { movies: [], total: 0 };
      const response = await fetch(`/api/movies/search/${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search movies");
      return response.json();
    },
    enabled: !!searchQuery,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const searchResults = searchData?.movies || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-16 px-4 lg:px-8 max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-search-title">
            Search Results for "{searchQuery}"
          </h1>
          <p className="text-muted-foreground" data-testid="text-search-count">
            {isLoading ? "Searching..." : `${searchResults.length} results found`}
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[16/9] bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && searchResults.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg" data-testid="text-no-results">
              No movies found matching "{searchQuery}"
            </p>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="grid-search-results">
            {searchResults.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                image={movie.posterImage}
                rating={parseFloat(movie.rating)}
                year={movie.year}
                genres={movie.genres}
                onPlay={() => console.log(`Play ${movie.title}`)}
                onAddToList={() => console.log(`Add ${movie.title} to list`)}
                onShowDetails={() => console.log(`Show details for ${movie.title}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
