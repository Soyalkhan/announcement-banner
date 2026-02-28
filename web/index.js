// @ts-check
import { join, dirname } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import connectDB from "./config/db.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import PrivacyWebhookHandlers from "./privacy.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? join(__dirname, "frontend", "dist")
    : join(__dirname, "frontend");

// Connect to MongoDB
connectDB();

const app = express();

// Health check for Railway (must be before Shopify middleware)
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// Auth middleware for all /api/* routes
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

// Routes
app.use("/api", announcementRoutes);

// Static files and SPA catch-all
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", (req, res, next) => {
  // Railway health check and direct access without shop param - return 200
  if (!req.query.shop) {
    return res.status(200).send("OK");
  }
  next();
}, shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  const apiKey = process.env.SHOPIFY_API_KEY || "";
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", apiKey)
        .replace(
          /(<meta name="shopify-api-key" content=")[^"]*(")/,
          `$1${apiKey}$2`
        )
    );
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
