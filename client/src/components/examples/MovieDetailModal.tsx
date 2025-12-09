import { useState } from 'react';
import MovieDetailModal from '../MovieDetailModal';
import { Button } from '@/components/ui/button';
import actionPoster from '@assets/generated_images/Action_movie_poster_1_4bfcb1ec.png';
import heroBackdrop from '@assets/generated_images/Action_hero_backdrop_0603e089.png';

export default function MovieDetailModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const movie = {
    title: "Shadow Protocol",
    image: actionPoster,
    backdropImage: heroBackdrop,
    rating: 8.5,
    year: 2024,
    duration: "2h 15m",
    genres: ["Action", "Thriller", "Drama"],
    description: "When a former intelligence operative discovers a global conspiracy, she must race against time to prevent a catastrophic attack that could change the world forever. With nowhere to turn and enemies on all sides, trust becomes the ultimate weapon in this pulse-pounding thriller.",
    cast: ["Emma Stone", "Ryan Gosling", "Idris Elba", "Lupita Nyong'o"],
    director: "Christopher Nolan"
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Movie Details</Button>
      <MovieDetailModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        movie={movie}
        onPlay={() => console.log('Play movie')}
      />
    </>
  );
}
