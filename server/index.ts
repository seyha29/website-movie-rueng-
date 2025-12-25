import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedData, ensureCriticalPlansExist } from "./seed";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import compression from "compression";
import path from "path";
import pg from "pg";

const app = express();

// Enable gzip compression for faster loading
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Trust proxy - Required for secure cookies to work behind Replit's proxy in production
app.set('trust proxy', 1);

// PostgreSQL session store for persistent sessions
const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    pendingLoginPhone?: string;
    pendingLoginTime?: number;
    pendingLoginPasswordHash?: string;
    pendingRegisterPhone?: string;
    pendingRegisterTime?: number;
    pendingRegisterFullName?: string;
    pendingRegisterPasswordHash?: string;
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Warn if SESSION_SECRET is not set in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn('⚠️  WARNING: SESSION_SECRET is not set! Using fallback secret. Please set SESSION_SECRET in your production environment for security.');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'reoung-movies-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new PgSession({
    pool: pgPool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 60, // Prune expired sessions every hour (in seconds)
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days - users stay logged in for a month
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  }
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Serve static files from attached_assets directory with caching
const staticOptions = {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  immutable: true
};
app.use('/generated_images', express.static(path.join(process.cwd(), 'attached_assets/generated_images'), staticOptions));
app.use('/stock_images', express.static(path.join(process.cwd(), 'attached_assets/stock_images'), staticOptions));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  await seedData();
  await ensureCriticalPlansExist();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
