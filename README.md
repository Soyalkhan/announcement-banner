# Announcement Bar - Shopify App

A Shopify embedded app that allows merchants to manage a storefront announcement banner directly from the Shopify Admin dashboard.

## How It Works

**Data flow:** Admin Dashboard → MongoDB + Shopify Metafield → Storefront

1. **Admin Dashboard** — Merchant types an announcement message (e.g., "Sale 50% Off") and clicks Save.
2. **Backend** — The Express server saves the text to MongoDB (audit history) and syncs it to a Shopify Shop Metafield (`my_app.announcement`) via the GraphQL Admin API.
3. **Storefront** — A Theme App Extension (App Embed Block) reads the metafield using Liquid and renders the announcement banner on every page.

## Tech Stack

- **MongoDB** — Stores announcement history (audit log)
- **Express** — Backend API server
- **React** — Frontend dashboard (Shopify Polaris v13)
- **Node.js** — Runtime

Additional tools:
- SQLite — Shopify session storage
- Shopify Admin GraphQL API — Metafield sync
- Theme App Extension — Storefront display (Liquid)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string
- [Shopify Partner Account](https://partners.shopify.com/signup)
- A [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) for testing

## Setup & Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd announcement-banner
```

### 2. Install dependencies

```bash
npm install
cd web && npm install
cd frontend && npm install
cd ../..
```

### 3. Start MongoDB

Make sure MongoDB is running locally:

```bash
mongod
```

Or set the `MONGODB_URI` environment variable to your MongoDB Atlas connection string.

### 4. Configure the app

Update `shopify.app.toml` with your app's `client_id` from the Shopify Partner Dashboard.

### 5. Run the app

```bash
npm run dev
```

This starts the Shopify CLI dev server, which:
- Creates a Cloudflare tunnel
- Starts the Express backend
- Starts the Vite frontend dev server
- Opens the app in your Shopify Admin

### 6. Install the app on your dev store

When you first open the app URL, Shopify will prompt you to install it. Accept the permissions (including metafield read/write).

### 7. Enable the Theme Extension

1. Go to **Online Store** → **Themes** → **Customize**
2. Click **App Embeds** (left sidebar)
3. Toggle on **Announcement Bar**
4. Save

## Usage

1. Open the app in your Shopify Admin
2. Type your announcement text (e.g., "Free shipping on orders over $50!")
3. Click **Save**
4. The announcement will appear on your storefront immediately

## Project Structure

```
announcement-banner/
├── shopify.app.toml              # Shopify app configuration
├── web/
│   ├── index.js                  # Express server + API routes
│   ├── shopify.js                # Shopify API client setup
│   ├── models/
│   │   └── Announcement.js       # Mongoose model (audit history)
│   └── frontend/
│       ├── pages/
│       │   └── index.jsx         # Announcement dashboard (Polaris)
│       └── components/
│           └── providers/        # Polaris + React Query providers
├── extensions/
│   └── announcement-bar/
│       ├── shopify.extension.toml
│       └── blocks/
│           └── announcement-banner.liquid  # App embed block
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcement` | Fetch current announcement text |
| POST | `/api/announcement` | Save announcement to MongoDB + Shopify metafield |
| GET | `/api/announcement/history` | Fetch announcement audit history (last 20) |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/announcement-bar` | MongoDB connection string |
| `SHOPIFY_API_KEY` | Set by Shopify CLI | App API key |

## Deployment

1. Build the frontend:
   ```bash
   cd web/frontend && SHOPIFY_API_KEY=<your-api-key> npm run build
   ```

2. Deploy to your hosting provider (Render, Heroku, Fly.io, etc.)

3. Set environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your-mongodb-atlas-uri>`
   - `SHOPIFY_API_KEY=<your-api-key>`
   - `SHOPIFY_API_SECRET=<your-api-secret>`

4. Deploy the theme extension:
   ```bash
   npm run deploy
   ```
