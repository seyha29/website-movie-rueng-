import { storage } from "./storage";
import type { InsertMovie, InsertUser, InsertSubscriptionPlan } from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users, subscriptionPlans, admins } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const { Pool } = pg;

export async function seedData() {
  // CRITICAL: Only seed data on FIRST INSTALLATION
  // NEVER erase existing data - user's movies are precious!
  
  const { total } = await storage.getAllMovies(1, 1);
  if (total > 0) {
    console.log(`Database has ${total} movies - SKIPPING seed (preserving existing data)`);
    return;
  }

  // Only seed if database is completely empty (first install)
  console.log("First installation detected - seeding initial data...");
  
  // NOTE: Admin accounts are now managed via the separate admins table
  // Default admin is created by ensureDefaultAdminExists() function

  const movies: InsertMovie[] = [
    {
      title: "Shadow Protocol",
      description: "When a former intelligence operative discovers a global conspiracy, she must race against time to prevent a catastrophic attack that could change the world forever. With nowhere to turn and enemies on all sides, trust becomes the ultimate weapon in this pulse-pounding thriller.",
      rating: "8.5",
      year: 2024,
      duration: "2h 15m",
      genres: ["Action", "Thriller", "Drama"],
      cast: ["Emma Stone", "Ryan Gosling", "Idris Elba", "Lupita Nyong'o"],
      director: "Christopher Nolan",
      posterImage: "/generated_images/Action_movie_poster_1_4bfcb1ec.png",
      backdropImage: "/generated_images/Action_hero_backdrop_0603e089.png",
    },
    {
      title: "Dark Whispers",
      description: "In a remote mansion, a family's dark secrets come alive when ancient spirits awaken. As reality blurs with nightmares, they must confront the terrifying truth about their bloodline before it consumes them all.",
      rating: "7.8",
      year: 2024,
      duration: "1h 58m",
      genres: ["Horror", "Mystery", "Thriller"],
      cast: ["Anya Taylor-Joy", "Oscar Isaac", "Tilda Swinton", "Bill Skarsgård"],
      director: "Ari Aster",
      posterImage: "/generated_images/Horror_movie_poster_d847a37c.png",
      backdropImage: "/generated_images/Action_hero_backdrop_0603e089.png",
    },
    {
      title: "Love's Journey",
      description: "Two strangers meet by chance in Paris and spend one magical night walking through the city, sharing their dreams and fears. As dawn approaches, they must decide if their connection is strong enough to change their lives forever.",
      rating: "8.2",
      year: 2024,
      duration: "2h 5m",
      genres: ["Romance", "Drama"],
      cast: ["Timothée Chalamet", "Zendaya", "Florence Pugh", "Dev Patel"],
      director: "Greta Gerwig",
      posterImage: "/generated_images/Romance_movie_poster_6834cd00.png",
      backdropImage: "/generated_images/Fantasy_movie_backdrop_6f9ff991.png",
    },
    {
      title: "Laugh Out Loud",
      description: "A struggling comedian gets one last chance to make it big when a viral video puts him in the spotlight. But fame comes with unexpected chaos as he navigates eccentric friends, industry politics, and his own insecurities.",
      rating: "7.5",
      year: 2024,
      duration: "1h 52m",
      genres: ["Comedy"],
      cast: ["Pete Davidson", "Awkwafina", "Kumail Nanjiani", "Jenny Slate"],
      director: "Judd Apatow",
      posterImage: "/generated_images/Comedy_movie_poster_3d6b61af.png",
      backdropImage: "/generated_images/Action_hero_backdrop_0603e089.png",
    },
    {
      title: "Cosmic Odyssey",
      description: "In the year 2247, humanity's last hope rests with a crew of misfits traveling through uncharted space to find a new home. What they discover will challenge everything they know about the universe and themselves.",
      rating: "9.0",
      year: 2024,
      duration: "2h 45m",
      genres: ["Sci-Fi", "Adventure", "Drama"],
      cast: ["Pedro Pascal", "Janelle Monáe", "John Boyega", "Tessa Thompson"],
      director: "Denis Villeneuve",
      posterImage: "/generated_images/Space_adventure_poster_6a3c6667.png",
      backdropImage: "/generated_images/Sci-fi_movie_backdrop_2d2af93f.png",
    },
    {
      title: "City of Shadows",
      description: "A detective haunted by his past investigates a series of brutal murders in the criminal underworld. As he gets closer to the truth, he realizes the killer knows everything about him and is always one step ahead.",
      rating: "8.7",
      year: 2024,
      duration: "2h 22m",
      genres: ["Crime", "Thriller", "Mystery"],
      cast: ["Jake Gyllenhaal", "Viola Davis", "Michael B. Jordan", "Rebecca Ferguson"],
      director: "David Fincher",
      posterImage: "/generated_images/Crime_thriller_poster_bc589b66.png",
      backdropImage: "/generated_images/Action_hero_backdrop_0603e089.png",
    },
    {
      title: "Hero Rising",
      description: "When an ancient evil threatens to destroy the world, an unlikely hero must embrace their destiny and unite warring kingdoms. Epic battles and personal sacrifice define this tale of courage against impossible odds.",
      rating: "8.9",
      year: 2024,
      duration: "2h 38m",
      genres: ["Action", "Fantasy", "Adventure"],
      cast: ["Tom Holland", "Gemma Chan", "Daniel Kaluuya", "Saoirse Ronan"],
      director: "Taika Waititi",
      posterImage: "/generated_images/Superhero_movie_poster_272a43c8.png",
      backdropImage: "/generated_images/Fantasy_movie_backdrop_6f9ff991.png",
    },
    {
      title: "Midnight Fear",
      description: "A family moves into their dream home, only to discover it harbors a sinister presence. As paranormal events escalate, they uncover the house's horrifying history and must escape before they become part of it.",
      rating: "7.6",
      year: 2024,
      duration: "1h 48m",
      genres: ["Horror", "Supernatural"],
      cast: ["Lupita Nyong'o", "Sterling K. Brown", "Elisabeth Moss", "Winston Duke"],
      director: "Jordan Peele",
      posterImage: "/generated_images/Horror_movie_poster_d847a37c.png",
      backdropImage: "/generated_images/Action_hero_backdrop_0603e089.png",
    },
    {
      title: "Eternal Love",
      description: "Through multiple lifetimes and across centuries, two souls are destined to find each other again and again. A sweeping romance that transcends time, exploring the enduring power of true love.",
      rating: "8.0",
      year: 2024,
      duration: "2h 12m",
      genres: ["Romance", "Drama", "Fantasy"],
      cast: ["Rachel McAdams", "Henry Golding", "Lily James", "Yahya Abdul-Mateen II"],
      director: "Sofia Coppola",
      posterImage: "/generated_images/Romance_movie_poster_6834cd00.png",
      backdropImage: "/generated_images/Fantasy_movie_backdrop_6f9ff991.png",
    },
    {
      title: "Space Warriors",
      description: "An elite team of space marines must defend a distant colony from an alien invasion. Outnumbered and outgunned, they'll need every ounce of courage and ingenuity to survive the night.",
      rating: "8.4",
      year: 2024,
      duration: "2h 18m",
      genres: ["Sci-Fi", "Action", "War"],
      cast: ["Chris Pratt", "Scarlett Johansson", "Mahershala Ali", "Gal Gadot"],
      director: "James Cameron",
      posterImage: "/generated_images/Space_adventure_poster_6a3c6667.png",
      backdropImage: "/generated_images/Sci-fi_movie_backdrop_2d2af93f.png",
    },
    {
      title: "The Heist",
      description: "A master thief assembles a crew for one final job: stealing from the world's most secure vault. But when betrayal strikes from within, the heist becomes a deadly game of survival.",
      rating: "8.3",
      year: 2024,
      duration: "2h 8m",
      genres: ["Crime", "Action", "Thriller"],
      cast: ["Brad Pitt", "Margot Robbie", "Cillian Murphy", "Ana de Armas"],
      director: "Steven Soderbergh",
      posterImage: "/generated_images/Crime_thriller_poster_bc589b66.png",
      backdropImage: "/generated_images/Action_hero_backdrop_0603e089.png",
    },
    {
      title: "Funny Business",
      description: "When a straight-laced accountant accidentally gets involved with the mob, hilarious chaos ensues. Mistaken identities, wild misunderstandings, and unexpected friendships turn his life upside down.",
      rating: "7.9",
      year: 2024,
      duration: "1h 55m",
      genres: ["Comedy", "Crime"],
      cast: ["Jason Sudeikis", "Melissa McCarthy", "Seth Rogen", "Tiffany Haddish"],
      director: "Paul Feig",
      posterImage: "/generated_images/Comedy_movie_poster_3d6b61af.png",
      backdropImage: "/generated_images/Action_hero_backdrop_0603e089.png",
    },
  ];

  console.log("Seeding movies...");
  for (const movie of movies) {
    await storage.createMovie(movie);
  }
  console.log(`Successfully seeded ${movies.length} movies`);

  // Seed subscription plans
  console.log("Seeding subscription plans...");
  const plans: InsertSubscriptionPlan[] = [
    {
      name: "free",
      displayName: "Free Plan",
      price: "0.00",
      currency: "USD",
      features: [
        "Watch limited content with ads",
        "Standard definition (SD)",
        "Stream on 1 device",
        "Limited movie library access"
      ],
      maxMovies: 10,
      isActive: 1
    },
    {
      name: "basic",
      displayName: "Basic Plan",
      price: "4.99",
      currency: "USD",
      features: [
        "Ad-free viewing experience",
        "High definition (HD) quality",
        "Stream on 2 devices simultaneously",
        "Access to full movie library",
        "Download movies for offline viewing"
      ],
      maxMovies: null, // unlimited
      isActive: 1
    },
    {
      name: "premium",
      displayName: "Premium Plan",
      price: "9.99",
      currency: "USD",
      features: [
        "Everything in Basic",
        "Ultra HD (4K) quality",
        "Stream on 4 devices simultaneously",
        "Early access to new releases",
        "Priority customer support",
        "Family sharing (up to 4 profiles)"
      ],
      maxMovies: null, // unlimited
      isActive: 1
    },
    {
      name: "monthly",
      displayName: "Monthly Plan",
      price: "5.99",
      currency: "USD",
      features: [
        "Full movie library access",
        "HD streaming quality",
        "Watch on 2 devices",
        "Ad-free experience"
      ],
      maxMovies: null, // unlimited
      isActive: 1
    }
  ];

  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    for (const plan of plans) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`Subscription plan created: ${plan.displayName}`);
    }
  }
  console.log(`Successfully seeded ${plans.length} subscription plans`);
}

// Separate function to ensure critical plans exist (runs every startup)
export async function ensureCriticalPlansExist() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL - skipping plan check");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Check for monthly plan (required for payments)
  const existingMonthly = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, 'monthly'))
    .limit(1);

  if (existingMonthly.length === 0) {
    console.log("Monthly plan missing - creating it now...");
    await db.insert(subscriptionPlans).values({
      name: "monthly",
      displayName: "Monthly Plan",
      price: "5.99",
      currency: "USD",
      features: [
        "Full movie library access",
        "HD streaming quality",
        "Watch on 2 devices",
        "Ad-free experience"
      ],
      maxMovies: null,
      isActive: 1
    });
    console.log("Monthly plan created successfully");
  } else {
    console.log("Monthly plan exists");
  }

  await pool.end();
}

export async function ensureDefaultAdminExists() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL - skipping admin check");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const existingAdmins = await db.select().from(admins).limit(1);

  if (existingAdmins.length === 0) {
    console.log("No admins found - creating default admin...");
    const hashedPassword = await bcrypt.hash("Samnang@@##5678", 10);
    
    await db.insert(admins).values({
      username: "admin",
      password: hashedPassword,
      fullName: "System Administrator",
      role: "full"
    });
    console.log("Default admin created (username: admin, password: Samnang@@##5678)");
  } else {
    console.log("Admins exist - skipping default admin creation");
  }

  await pool.end();
}
