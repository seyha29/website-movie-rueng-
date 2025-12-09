# Reoung Movies Flix - Design Guidelines

## Design Approach
**Reference-Based:** iFlix-inspired streaming platform with clean, minimalist aesthetic. Draw from iFlix's content density and grid layouts, and modern streaming platforms' effortless browsing experiences.

**Core Principles:**
- Minimalist content-first: Visual media with subtle interface chrome
- Clean grid layouts: Organized browsing with consistent spacing
- Dark sophistication: Deep blacks with orange accent highlighting
- Effortless discovery: Dense grid layout for maximum content visibility

## Color System
**Primary Palette:**
- Orange Primary: #f97316 (buttons, highlights, active states)
- Orange Hover: #ea580c
- Background Base: #0a0a0a (body background)
- Card Backgrounds: #141414 (primary cards), #171717 (secondary surfaces), #292929 (hover states)
- Border: #2d2d2d (subtle dividers and card outlines)
- Text: White (#ffffff) primary, #a3a3a3 secondary/metadata

## Typography
**Font Family:** Inter (all elements)

**Type Scale:**
- Section Headers: text-2xl lg:text-3xl, font-semibold
- Movie Titles: text-lg, font-medium
- Metadata: text-sm, font-normal, text-neutral-400
- Body: text-base, leading-relaxed

## Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16

**Grid Structure:**
- Max container: max-w-screen-2xl mx-auto px-4 lg:px-8
- Movie grid: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6, gap-4
- Carousel items: Horizontal scroll with gap-3 to gap-4

## Component Library

### Navigation Header
- Fixed position (sticky top-0 z-50), h-16 lg:h-20
- Background: bg-black/95 backdrop-blur-sm with border-b border-neutral-800
- Logo left (orange accent), navigation links center, search bar and user menu right
- Search: Expandable input with subtle bg-neutral-800/50 rounded-full

### Genre Filter Bar
- Border bottom with bg-background
- Category dropdown and movie count display
- Compact design (py-3 lg:py-4)
- Positioned directly below header

### Movie Cards (Grid & Carousel)
- Container: bg-neutral-900/50 rounded-lg overflow-hidden border border-neutral-800/50
- Aspect ratio: 3:4 (portrait poster) or 16:9 (landscape thumbnail)
- Image: w-full h-full object-cover
- Hover: transform scale-105 transition-transform duration-300, bg-neutral-800/70
- Overlay on hover: Gradient from-transparent to-black/90 with title and quick actions
- Quick actions: Play icon (orange), Add to List, Info icons (white)
- Rounded corners: rounded-lg

### Browse Grid Sections
- Section header: text-2xl font-semibold mb-6, optional "View All" link (text-orange-500)
- Grid layout with consistent gap-4
- Categories: Trending, New Releases, Action, Drama, Comedy, Thriller, Horror, Sci-Fi
- Each section displays 12-18 movies in grid format
- Load more button at bottom: ghost style with border-neutral-700

### Carousels (Featured Collections)
- Horizontal scroll container with snap-scroll
- Show 2-3 cards mobile, 4-5 tablet, 6-7 desktop
- Navigation arrows: Absolute positioned on hover, bg-black/60 backdrop-blur rounded-full
- Section title with left alignment, mb-4

### Movie Detail Modal/Page
- Backdrop image: min-h-[50vh] with gradient overlay
- Content section: Two-column layout (poster left, details right)
- Details include: Title, description, metadata (director, cast, year, rating)
- Cast grid: grid-cols-3 md:grid-cols-6, circular avatars (w-16 h-16) with names below
- "Similar Movies" carousel section below
- Trailer section: 16:9 video player with controls

### Buttons
- Primary (Orange): bg-orange-500 hover:bg-orange-600, px-6 py-3, rounded-lg, font-medium
- Ghost: bg-transparent border border-neutral-700 hover:bg-neutral-800, same padding
- Secondary: bg-neutral-800 hover:bg-neutral-700, same padding
- Overlay buttons: backdrop-blur-md bg-white/10 border border-white/20 (for use over images)

### Search Results
- Grid layout matching browse grid
- Filter chips: Horizontal scroll, bg-neutral-800 border border-neutral-700, active state bg-orange-500
- Empty state: Centered message with movie reel icon and suggestions

### Footer
- bg-neutral-950 border-t border-neutral-800
- Four-column layout: About, Browse, Support, Social
- Compact links (text-sm text-neutral-400 hover:text-white)
- Logo and copyright bottom row

## Images

### Movie Cards:
- High-quality movie posters (portrait 2:3 ratio)
- Landscape thumbnails for certain contexts (16:9)
- 60-80 diverse movie thumbnails across categories
- Professional quality stills and promotional images

## Interaction Patterns
- Hover scale: scale-105 on images, duration-300 ease-in-out
- Background lightening: hover:bg-neutral-800 from bg-neutral-900
- Smooth transitions: transition-all duration-200
- Minimal shadows: Only on modals and overlays
- Subtle borders throughout for definition

## Spacing & Rhythm
- Section vertical: mb-12 lg:mb-16
- Between grid sections: space-y-12
- Internal card spacing: p-4
- Content spacing: space-y-4 to space-y-6
- Navigation internal: space-x-6 to space-x-8