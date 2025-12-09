import MovieCard from '../MovieCard';
import actionPoster from '@assets/generated_images/Action_movie_poster_1_4bfcb1ec.png';

export default function MovieCardExample() {
  return (
    <div className="w-80">
      <MovieCard
        id="1"
        title="Shadow Protocol"
        image={actionPoster}
        rating={8.5}
        year={2024}
        genres={["Action", "Thriller"]}
        onPlay={() => console.log('Play clicked')}
        onAddToList={() => console.log('Add to list clicked')}
        onShowDetails={() => console.log('Show details clicked')}
      />
    </div>
  );
}
