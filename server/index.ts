import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import compression from "compression";
import path from "path";
import pg from "pg";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedData } from "./seed";

const app = express();

/* =========================
   Compression
========================= */
app.use(
  compression({
    level: 6,
    threshold: 1024,
  })
);

/* =========================
   Trust proxy (REQUIRED)
========================= */
app.set("trust proxy", 1);

/* =========================
   Database (PostgreSQL)
========================= */
const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

/* =========================
   Session types
========================= */
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

/* =========================
   Sessions
========================= */
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.warn("⚠️ SESSION_SECRET not set – using fallback (NOT recommended)");
}

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "replit-secret-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool: pgPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  })
);

/* =========================
   Body parsing
========================= */
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

/* =========================
   Static assets
========================= */
const staticOptions = {
  maxAge: "7d",
  etag: true,
  lastModified: true,
  immutable: true,
};

app.use(
  "/generated_images",
  express.static(
    path.join(process.cwd(), "attached_assets/generated_images"),
    staticOptions
  )
);
app.use(
  "/stock_images",
  express.static(
    path.join(process.cwd(), "attached_assets/stock_images"),
    staticOptions
  )
);

/* =========================
   Request logging
========================= */
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  const originalJson = res.json.bind(res);
  let responseBody: any;

  res.json = (body: any) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      const duration = Date.now() - start;
      log(
        `${req.method} ${reqPath} ${res.statusCode} - ${duration}ms`
      );
    }
  });

  next();
});

/* =========================
   App bootstrap
========================= */
(async () => {
  const server = await registerRoutes(app);
  await seedData();

  /* Error handler */
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    }
  );

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* =========================
     🔥 CORRECT REPLIT PORT
  ========================= */
  const PORT = Number(process.env.PORT) || 5000;

  server.listen(
    {
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`🚀 Server running on port ${PORT}`);
    }
  );
})();