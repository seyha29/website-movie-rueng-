import { useQuery } from "@tanstack/react-query";
import { Movie } from "@shared/schema";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PurchasedMovies() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  const { data, isLoading } = useQuery<{ movies: Movie[] }>({
    queryKey: ["/api/credit-movies"],
    staleTime: 2 * 60 * 1000,
  });

  const movies = data?.movies || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-orange-500" />
              {language === 'km' ? 'ភាពយន្តសម្រាប់ក្រេឌីត' : 'Movies for Credit'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {language === 'km' 
                ? 'ភាពយន្តទាំងអស់ដែលអ្នកអាចទិញដោយប្រើសមតុល្យក្រេឌីត' 
                : 'All movies available for purchase with your credit balance'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'km' ? 'មិនមានភាពយន្តទេ' : 'No movies available'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'km' 
                ? 'បច្ចុប្បន្នមិនមានភាពយន្តសម្រាប់ទិញដោយក្រេឌីតទេ។' 
                : 'No movies are currently available for credit purchase.'}
            </p>
            <Button onClick={() => navigate("/")} className="bg-orange-500 hover:bg-orange-600">
              {language === 'km' ? 'រកមើលភាពយន្តទាំងអស់' : 'Browse All Movies'}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {movies.length} {language === 'km' ? 'ភាពយន្ត' : 'movie'}{movies.length !== 1 && language !== 'km' ? 's' : ''}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="group relative cursor-pointer rounded-lg overflow-hidden bg-card border border-border transition-all hover:scale-105 hover:border-orange-500/50"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                >
                  <div className="aspect-[2/3] relative">
                    <img
                      src={movie.posterImage}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        className="h-12 w-12 rounded-full bg-orange-500 hover:bg-orange-600"
                      >
                        <Play className="h-5 w-5 fill-current" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span className="text-orange-400">{language === 'km' ? 'ក្រេឌីត' : 'Credit'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
