import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Movie } from "@shared/schema";
import { countries } from "@shared/countries";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const AVAILABLE_GENRES = [
  "វាយប្រហារ",
  "ផ្សងព្រេង",
  "កំប្លែង",
  "ឧក្រិដ្ឋកម្ម",
  "ស្នេហា",
  "ប្រឌិត",
  "ខ្មោច",
  "អាថ៍កំបាំង",
  "មនោសញ្ចេតនា",
  "វិទ្យាសាស្ត្រ",
  "អរូបីយ៏",
  "រន្ធត់",
  "សង្គ្រាម",
  "គំនូរជីវចល"
];

// Genre mapping: Khmer to English for database storage
const GENRE_MAPPING: { [key: string]: string } = {
  "វាយប្រហារ": "Action",
  "ផ្សងព្រេង": "Adventure",
  "កំប្លែង": "Comedy",
  "ឧក្រិដ្ឋកម្ម": "Crime",
  "ស្នេហា": "Drama",
  "ប្រឌិត": "Fantasy",
  "ខ្មោច": "Horror",
  "អាថ៍កំបាំង": "Mystery",
  "មនោសញ្ចេតនា": "Romance",
  "វិទ្យាសាស្ត្រ": "Sci-Fi",
  "អរូបីយ៏": "Supernatural",
  "រន្ធត់": "Thriller",
  "សង្គ្រាម": "War",
  "គំនូរជីវចល": "Anime"
};

// Reverse mapping: English to Khmer for display
const ENGLISH_TO_KHMER: { [key: string]: string } = {
  "Action": "វាយប្រហារ",
  "Adventure": "ផ្សងព្រេង",
  "Comedy": "កំប្លែង",
  "Crime": "ឧក្រិដ្ឋកម្ម",
  "Drama": "ស្នេហា",
  "Fantasy": "ប្រឌិត",
  "Horror": "ខ្មោច",
  "Mystery": "អាថ៍កំបាំង",
  "Romance": "មនោសញ្ចេតនា",
  "Sci-Fi": "វិទ្យាសាស្ត្រ",
  "Supernatural": "អរូបីយ៏",
  "Thriller": "រន្ធត់",
  "War": "សង្គ្រាម",
  "Anime": "គំនូរជីវចល"
};

// Check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Check if URL is Vimeo
const isVimeoUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('vimeo.com');
};

// Check if URL is a direct video file
const isDirectVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.m3u8') || lowerUrl.endsWith('.mov');
};

// Extract video ID from YouTube URL
const extractYouTubeId = (url: string): string => {
  if (!url) return "";
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return "";
};

// Extract video ID from Vimeo URL
const extractVimeoId = (url: string): string => {
  if (!url) return "";
  const pattern = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : "";
};

// Build proper embed URL for different sources
const buildEmbedUrl = (url: string): string => {
  if (!url) return "";
  
  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  
  if (isVimeoUrl(url)) {
    const videoId = extractVimeoId(url);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }
  
  // For other URLs (QloudHost, iframe embeds), use as-is
  return url;
};

// Legacy function for backward compatibility
const extractVideoId = (url: string): string => {
  if (isYouTubeUrl(url)) return extractYouTubeId(url);
  if (isVimeoUrl(url)) return extractVimeoId(url);
  return "";
};

export default function VideoManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const { data: moviesData, isLoading, refetch } = useQuery<{ movies: Movie[], total: number }>({
    queryKey: ["/api/movies", { page: 1, limit: 1000 }],
    queryFn: async () => {
      const response = await fetch("/api/movies?page=1&limit=1000", {
        credentials: "include",
        cache: "no-store" // Always fetch fresh data
      });
      if (!response.ok) throw new Error("Failed to fetch movies");
      return response.json();
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: "always", // Always refetch when component mounts
  });

  const movies = moviesData?.movies || [];

  const deleteMovieMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/movies/${id}`, {});
      return response;
    },
    onSuccess: async () => {
      // Force refetch all movie queries to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ["/api/movies"] });
      await queryClient.refetchQueries({ queryKey: ["/api/movies/trending"] });
      await queryClient.refetchQueries({ queryKey: ["/api/movies/new-and-popular"] });
      await queryClient.refetchQueries({ queryKey: ["/api/movies/hero-banner"] });
      toast({
        title: "Movie deleted",
        description: "The movie has been removed successfully",
      });
    },
    onError: async (error: Error) => {
      // If movie not found (404), it's already deleted - refresh the list
      if (error.message.includes("404")) {
        await refetch();
        toast({
          title: "List refreshed",
          description: "The movie was already deleted. List has been updated.",
        });
      } else {
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleDelete = (movie: Movie) => {
    if (window.confirm(`Are you sure you want to delete "${movie.title}"?`)) {
      deleteMovieMutation.mutate(movie.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-10 w-48 bg-muted/20 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Video Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Add, edit, and manage all videos</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-video" size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Video</DialogTitle>
              <DialogDescription className="text-sm">Add a new movie with embed URL</DialogDescription>
            </DialogHeader>
            <VideoForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {movies.map((movie) => (
          <Card key={movie.id} data-testid={`card-movie-${movie.id}`}>
            <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 space-y-0 pb-2">
              <div className="flex-1 w-full">
                <CardTitle className="text-lg sm:text-xl">{movie.title}</CardTitle>
                <CardDescription className="mt-2 line-clamp-2 text-sm">
                  {movie.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                  {movie.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {ENGLISH_TO_KHMER[genre] || genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingMovie(movie)}
                      data-testid={`button-edit-${movie.id}`}
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Edit Video</DialogTitle>
                      <DialogDescription className="text-sm">Update movie information</DialogDescription>
                    </DialogHeader>
                    <VideoForm movie={editingMovie || undefined} onSuccess={() => setEditingMovie(null)} />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(movie)}
                  data-testid={`button-delete-${movie.id}`}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="ml-1 sm:ml-2 font-semibold">{movie.rating}/10</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Year:</span>
                  <span className="ml-1 sm:ml-2 font-semibold">{movie.year}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-1 sm:ml-2 font-semibold">{movie.duration}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="text-muted-foreground">Director:</span>
                  <span className="ml-1 sm:ml-2 font-semibold truncate block sm:inline">{movie.director}</span>
                </div>
              </div>
              {movie.videoEmbedUrl && (
                <div className="mt-3 sm:mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm text-muted-foreground">Embed URL:</span>
                      <p className="text-xs sm:text-sm text-blue-500 truncate mt-1">{movie.videoEmbedUrl}</p>
                    </div>
                    {extractVideoId(movie.videoEmbedUrl) && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded border border-border">
                        <span className="text-xs text-muted-foreground">ID:</span>
                        <span className="text-xs font-mono font-semibold" data-testid={`text-video-id-${movie.id}`}>
                          {extractVideoId(movie.videoEmbedUrl)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {movies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No videos yet. Add your first video to get started.
        </div>
      )}
    </div>
  );
}

interface VideoFormProps {
  movie?: Movie;
  onSuccess: () => void;
}

function VideoForm({ movie, onSuccess }: VideoFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: movie?.title || "",
    description: movie?.description || "",
    rating: movie?.rating || "7.5",
    imdbRating: movie?.imdbRating || "",
    tmdbRating: movie?.tmdbRating || "",
    year: movie?.year || new Date().getFullYear(),
    duration: movie?.duration || "2h 00m",
    genres: movie?.genres.map(g => ENGLISH_TO_KHMER[g] || g) || [],
    cast: movie?.cast.join(", ") || "",
    director: movie?.director || "",
    country: movie?.country || "USA",
    posterImage: movie?.posterImage || "",
    backdropImage: movie?.backdropImage || "",
    videoEmbedUrl: movie?.videoEmbedUrl || "",
    trailerUrl: movie?.trailerUrl || "",
    isFree: movie?.isFree === 1,
    price: movie?.price || "1.00",
    allowCreditPurchase: movie?.allowCreditPurchase !== 0, // Default to true
    isTrending: movie?.isTrending === 1,
    isNewAndPopular: movie?.isNewAndPopular === 1,
    isHeroBanner: movie?.isHeroBanner === 1,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        rating: data.rating.toString(),
        imdbRating: data.imdbRating ? data.imdbRating.toString() : null,
        tmdbRating: data.tmdbRating ? data.tmdbRating.toString() : null,
        year: parseInt(data.year.toString()),
        genres: data.genres.map(g => GENRE_MAPPING[g] || g),
        cast: data.cast.split(",").map((c) => c.trim()).filter(Boolean),
        isFree: data.isFree ? 1 : 0,
        price: data.isFree ? "0.00" : data.price.toString(),
        allowCreditPurchase: data.allowCreditPurchase ? 1 : 0,
        isTrending: data.isTrending ? 1 : 0,
        isNewAndPopular: data.isNewAndPopular ? 1 : 0,
        isHeroBanner: data.isHeroBanner ? 1 : 0,
      };

      if (movie) {
        await apiRequest("PUT", `/api/admin/movies/${movie.id}`, payload);
      } else {
        await apiRequest("POST", "/api/admin/movies", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies/trending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies/new-and-popular"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movies/hero-banner"] });
      toast({
        title: movie ? "Movie updated" : "Movie added",
        description: `The movie has been ${movie ? "updated" : "added"} successfully`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            data-testid="input-video-title"
            className="text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={3}
            data-testid="input-video-description"
            className="text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium">Full Movie - Video Embed URL</label>
          <Input
            type="url"
            value={formData.videoEmbedUrl}
            onChange={(e) => setFormData({ ...formData, videoEmbedUrl: e.target.value })}
            placeholder="Paste video URL from QloudHost, YouTube, Vimeo, or any iframe embed..."
            data-testid="input-video-embed-url"
            className="text-sm"
          />
          {formData.videoEmbedUrl && extractVideoId(formData.videoEmbedUrl) && (
            <div className="mt-2 p-2 bg-muted/50 rounded-md border border-border">
              <p className="text-xs text-muted-foreground">Detected Video ID:</p>
              <p className="text-sm font-mono font-semibold" data-testid="text-video-id">
                {extractVideoId(formData.videoEmbedUrl)}
              </p>
            </div>
          )}
          {/* Full Movie Video Preview */}
          {formData.videoEmbedUrl && (
            <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-xs font-medium text-green-600 mb-2">Full Movie Preview:</p>
              <p className="text-xs text-muted-foreground mb-2 break-all">URL: {formData.videoEmbedUrl}</p>
              <div className="relative aspect-video w-full max-w-md rounded-md overflow-hidden bg-black">
                {isDirectVideoUrl(formData.videoEmbedUrl) ? (
                  <video
                    src={formData.videoEmbedUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-contain"
                    data-testid="video-movie-preview"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <iframe
                    src={buildEmbedUrl(formData.videoEmbedUrl)}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    title="Full Movie Preview"
                    data-testid="iframe-movie-preview"
                  />
                )}
              </div>
            </div>
          )}
          <div className="mt-2 p-3 bg-orange-500/10 rounded-md border border-orange-500/30">
            <p className="text-xs font-medium text-orange-600 mb-1">Supported Video Sources:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• <span className="font-medium">QloudHost:</span> https://your-server.com/embed/video123</li>
              <li>• <span className="font-medium">Direct MP4:</span> https://your-server.com/videos/movie.mp4</li>
              <li>• <span className="font-medium">YouTube:</span> https://youtube.com/watch?v=xxx</li>
              <li>• <span className="font-medium">Vimeo:</span> https://vimeo.com/123456</li>
              <li>• <span className="font-medium">Any iframe:</span> Paste any video embed URL</li>
            </ul>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium">Trailer URL (Free Preview)</label>
          <Input
            type="url"
            value={formData.trailerUrl}
            onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
            placeholder="Paste trailer URL from YouTube, Vimeo, or any source..."
            data-testid="input-trailer-url"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Free trailer preview (YouTube, Vimeo, QloudHost, or any embed URL)
          </p>
          {/* Trailer Preview */}
          {formData.trailerUrl && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-xs font-medium text-primary mb-2">Trailer Preview:</p>
              <p className="text-xs text-muted-foreground mb-2 break-all">URL: {formData.trailerUrl}</p>
              <div className="relative aspect-video w-full max-w-md rounded-md overflow-hidden bg-black">
                {isDirectVideoUrl(formData.trailerUrl) ? (
                  <video
                    src={formData.trailerUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-contain"
                    data-testid="video-trailer-preview"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <iframe
                    src={buildEmbedUrl(formData.trailerUrl)}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    title="Trailer Preview"
                    data-testid="iframe-trailer-preview"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price Setting */}
        <div className="sm:col-span-2">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
            <div className="flex items-center space-x-2">
              <Switch
                id="is-free"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                data-testid="switch-is-free"
              />
              <Label htmlFor="is-free" className="text-xs sm:text-sm font-medium">
                Free to play
              </Label>
            </div>

            {!formData.isFree && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="price" className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    Price ($):
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.50"
                    min="0.50"
                    max="100"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-24 text-sm"
                    placeholder="1.00"
                    data-testid="input-movie-price"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-credit-purchase"
                    checked={formData.allowCreditPurchase}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowCreditPurchase: checked })}
                    data-testid="switch-allow-credit-purchase"
                  />
                  <Label htmlFor="allow-credit-purchase" className="text-xs sm:text-sm">
                    Allow Credit Purchase
                  </Label>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="hero-banner"
              checked={formData.isHeroBanner}
              onCheckedChange={(checked) => setFormData({ ...formData, isHeroBanner: checked })}
              data-testid="switch-hero-banner"
            />
            <Label htmlFor="hero-banner" className="text-xs sm:text-sm font-medium">
              Push to "Hero Banner"
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="trending"
              checked={formData.isTrending}
              onCheckedChange={(checked) => setFormData({ ...formData, isTrending: checked })}
              data-testid="switch-trending"
            />
            <Label htmlFor="trending" className="text-xs sm:text-sm font-medium">
              Push to "Trending Now"
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="new-popular"
              checked={formData.isNewAndPopular}
              onCheckedChange={(checked) => setFormData({ ...formData, isNewAndPopular: checked })}
              data-testid="switch-new-popular"
            />
            <Label htmlFor="new-popular" className="text-xs sm:text-sm font-medium">
              Push to "New & Popular"
            </Label>
          </div>
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium">Rating (0-10)</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            required
            data-testid="input-video-rating"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium">IMDb Rating (0-10)</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.imdbRating}
            onChange={(e) => setFormData({ ...formData, imdbRating: e.target.value })}
            placeholder="e.g., 8.5"
            data-testid="input-video-imdb-rating"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium">TMDb Rating (0-10)</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.tmdbRating}
            onChange={(e) => setFormData({ ...formData, tmdbRating: e.target.value })}
            placeholder="e.g., 7.8"
            data-testid="input-video-tmdb-rating"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium">Year</label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
            data-testid="input-video-year"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium">Duration</label>
          <Input
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="2h 15m"
            required
            data-testid="input-video-duration"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium">Director</label>
          <Input
            value={formData.director}
            onChange={(e) => setFormData({ ...formData, director: e.target.value })}
            required
            data-testid="input-video-director"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium">Country</label>
          <Select
            value={formData.country}
            onValueChange={(value) => setFormData({ ...formData, country: value })}
          >
            <SelectTrigger data-testid="select-video-country" className="text-sm">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.filter(c => c !== "All").map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium mb-3 block">Genres (select all that apply)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AVAILABLE_GENRES.map((genre) => (
              <div key={genre} className="flex items-center space-x-2">
                <Checkbox
                  id={`genre-${genre}`}
                  checked={formData.genres.includes(genre)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ ...formData, genres: [...formData.genres, genre] });
                    } else {
                      setFormData({ ...formData, genres: formData.genres.filter((g) => g !== genre) });
                    }
                  }}
                  data-testid={`checkbox-genre-${genre.toLowerCase()}`}
                />
                <Label 
                  htmlFor={`genre-${genre}`} 
                  className="text-xs sm:text-sm font-normal cursor-pointer"
                >
                  {genre}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium">Cast (comma separated)</label>
          <Input
            value={formData.cast}
            onChange={(e) => setFormData({ ...formData, cast: e.target.value })}
            placeholder="Actor 1, Actor 2, Actor 3"
            required
            data-testid="input-video-cast"
            className="text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium">Poster Image URL</label>
          <Input
            type="url"
            value={formData.posterImage}
            onChange={(e) => setFormData({ ...formData, posterImage: e.target.value })}
            required
            data-testid="input-video-poster"
            className="text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs sm:text-sm font-medium">Backdrop Image URL</label>
          <Input
            type="url"
            value={formData.backdropImage}
            onChange={(e) => setFormData({ ...formData, backdropImage: e.target.value })}
            required
            data-testid="input-video-backdrop"
            className="text-sm"
          />
        </div>
      </div>

      <Button type="submit" className="w-full text-sm" disabled={saveMutation.isPending} data-testid="button-save-video">
        {saveMutation.isPending ? "Saving..." : movie ? "Update Video" : "Add Video"}
      </Button>
    </form>
  );
}
