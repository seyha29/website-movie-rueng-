import VideoPlayer from '../VideoPlayer';
import heroBackdrop from '@assets/generated_images/Action_hero_backdrop_0603e089.png';

export default function VideoPlayerExample() {
  return (
    <VideoPlayer
      title="Shadow Protocol"
      posterUrl={heroBackdrop}
      onClose={() => console.log('Close player')}
    />
  );
}
