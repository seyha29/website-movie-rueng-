import HeroSection from '../HeroSection';
import heroBackdrop from '@assets/generated_images/Action_hero_backdrop_0603e089.png';

export default function HeroSectionExample() {
  return (
    <HeroSection
      title="Shadow Protocol"
      description="When a former intelligence operative discovers a global conspiracy, she must race against time to prevent a catastrophic attack that could change the world forever. With nowhere to turn and enemies on all sides, trust becomes the ultimate weapon."
      backgroundImage={heroBackdrop}
      rating={8.5}
      year={2024}
      duration="2h 15m"
      genres={["Action", "Thriller", "Drama"]}
      onPlay={() => console.log('Play clicked')}
      onMoreInfo={() => console.log('More info clicked')}
    />
  );
}
