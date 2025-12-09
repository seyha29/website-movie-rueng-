import MovieCarousel from '../MovieCarousel';
import actionPoster from '@assets/generated_images/Action_movie_poster_1_4bfcb1ec.png';
import horrorPoster from '@assets/generated_images/Horror_movie_poster_d847a37c.png';
import romancePoster from '@assets/generated_images/Romance_movie_poster_6834cd00.png';
import comedyPoster from '@assets/generated_images/Comedy_movie_poster_3d6b61af.png';
import spacePoster from '@assets/generated_images/Space_adventure_poster_6a3c6667.png';

export default function MovieCarouselExample() {
  const movies = [
    { id: "1", title: "Shadow Protocol", image: actionPoster, rating: 8.5, year: 2024, genres: ["Action", "Thriller"] },
    { id: "2", title: "Dark Whispers", image: horrorPoster, rating: 7.8, year: 2024, genres: ["Horror", "Mystery"] },
    { id: "3", title: "Love's Journey", image: romancePoster, rating: 8.2, year: 2024, genres: ["Romance", "Drama"] },
    { id: "4", title: "Laugh Out Loud", image: comedyPoster, rating: 7.5, year: 2024, genres: ["Comedy"] },
    { id: "5", title: "Cosmic Odyssey", image: spacePoster, rating: 9.0, year: 2024, genres: ["Sci-Fi", "Adventure"] },
    { id: "6", title: "Shadow Protocol 2", image: actionPoster, rating: 8.3, year: 2024, genres: ["Action", "Thriller"] },
  ];

  return <MovieCarousel title="Trending Now" movies={movies} onPlayMovie={(id) => console.log(`Play movie ${id}`)} />;
}
