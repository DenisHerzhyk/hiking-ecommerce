Readme · MD

# 🏔️ TrailBlaze — Hiking E-Commerce

> **Live demo:** [hiking-ecommerce.vercel.app](https://hiking-ecommerce.vercel.app/)

TrailBlaze is a full-stack hiking e-commerce platform that blends outdoor gear shopping with hiking trail discovery. Users can browse and buy gear, search real hiking trails, view interactive maps, check weather forecasts, and get AI-powered gear recommendations for a specific trail and date.

---

## ✨ Features

**E-Commerce**

- Product catalog with filtering by category, size, price, and gender
- Product detail pages with size/color selectors and size guide
- Cart, wishlist, and Stripe checkout
- Order tracking with live status updates
  **Trail Discovery**
- Search trails by city, park, or region (OpenStreetMap / Overpass API)
- Interactive Leaflet maps with route, elevation, and difficulty
- Trail length computed locally from the Overpass geometry, so the list needs no routing API call
- Quick-search presets (Swiss Alps, Black Forest, Dolomites, Pyrenees)
  **AI Gear Advisor**
- Powered by Claude (Anthropic)
- Recommends gear from the store's inventory based on trail difficulty and weather forecast
  **Admin Page**
- Internal dashboard for managing inventory
- View all products with per-size stock levels
- Increase or decrease stock per size
- Remove a size entirely from a product
  **User System**
- JWT auth via httpOnly cookies, email verification (Resend)
- Profile management, protected/guest-only routes

---

## 🧰 Tech Stack

**Frontend:** React 19, Vite 7, TypeScript, React Router 7, Tailwind CSS 4, DaisyUI 5, Leaflet, Stripe, react-hot-toast

**Backend:** Node.js / Express 5, Prisma 7 (PostgreSQL via Neon), JWT + bcrypt, Stripe, Anthropic SDK, Resend, Nodemon

**External APIs:** Open-Meteo (weather), OpenRouteService (routing), Overpass API + Nominatim (trails/geocoding), Pexels (photos), Cloudinary (media hosting)

**Infrastructure:** Vercel (frontend), Render (backend), pnpm, Concurrently

---

## 📁 Project Structure

```
├── client/                     # React frontend
│   └── src/
│       ├── pages/              # home, category, product_page, cart, login,
│       │                       # register, profile, order, Trails, admin
│       ├── shared/             # header, footer, checkout, shared components
│       │   └── services/       # external API clients, trail length calculation
│       └── axios.ts            # shared client, redirects on an invalid session
├── server/                     # Express backend
│   ├── config/                 # database, JWT, Resend config
│   ├── middlewares/            # auth middleware
│   ├── controllers/            # route handlers
│   ├── routes/                 # route definitions
│   └── services/               # business logic (cart, wishlist, orders, stock)
├── prisma/                     # schema, seed data, migrations
└── public/json/                # static seed data
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- pnpm (recommended) or npm
- A PostgreSQL database (Neon works great)

### Setup

```bash
git clone https://github.com/your-username/trailblaze.git
cd trailblaze
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://...
PORT=4996

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

PEXELS_API_KEY=your-pexels-key
ANTHROPIC_API_KEY=your-anthropic-key
ORS_API_KEY=your-openrouteservice-key
RESEND_API_KEY=your-resend-key

# Base URLs used to build email verification links and post-verify redirects.
# Both default to the local dev servers when unset, so they can be omitted
# during local development. Deployed environments set them to real hosts.
VERCEL_URL=http://localhost:5173
RENDER_URL=http://localhost:4996
```

```bash
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4996

### Scripts

| Script            | Description                                     |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Start frontend + backend together (development) |
| `npm run server`  | Start Express API with file watching            |
| `npm run build`   | Build frontend for production                   |
| `npm run preview` | Preview production build locally                |
| `npm run lint`    | Lint the codebase                               |

---

## 🌐 Deployment

- **Frontend (Vercel):** [hiking-ecommerce.vercel.app](https://hiking-ecommerce.vercel.app/) — auto-deploys on push to main
- **Backend (Render):** [trailblaze-blr0.onrender.com](https://trailblaze-blr0.onrender.com/)

---

## 🗄️ Database Schema

| Model                       | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| **User**                    | Account info, email verification, password              |
| **Product**                 | Title, price, sizes, stock, categories, images, details |
| **Cart / CartItem**         | User's cart and its items                               |
| **Wishlist / WishlistItem** | Saved products                                          |
| **Order / OrderItem**       | Purchases and their line items                          |
| **DeliveryAddress**         | Saved shipping addresses per user                       |

---

## 🧪 API Overview

All routes are prefixed with `/api`.

| Route                                   | Purpose                            | Auth      |
| --------------------------------------- | ---------------------------------- | --------- |
| `GET /products`                         | List all products                  | ✗         |
| `GET /products/:productId`              | Product details                    | ✗         |
| `POST /user/register`                   | Create account                     | ✗         |
| `GET /user/verify-email`                | Confirm email from the mailed link | ✗         |
| `POST /user/login`                      | Log in                             | ✗         |
| `POST /user/logout`                     | Log out and clear the cookie       | ✗         |
| `GET /user/profile`                     | Session check                      | ✓         |
| `GET /user/get_user`                    | Profile details                    | ✓         |
| `PUT /user/change`                      | Update profile                     | ✓         |
| `GET /cart`                             | Get cart items                     | ✓         |
| `POST /cart/add/:productId`             | Add to cart                        | ✓         |
| `POST /cart/update/:id`                 | Change item quantity               | ✓         |
| `DELETE /cart/remove/:productId`        | Remove from cart                   | ✓         |
| `POST /cart/movewishlist/:productId`    | Move item to wishlist              | ✓         |
| `GET /wishlist`                         | Get wishlist                       | ✓         |
| `POST /wishlist/add/:productId`         | Add to wishlist                    | ✓         |
| `DELETE /wishlist/remove/:productId`    | Remove from wishlist               | ✓         |
| `POST /wishlist/movecart/:productId`    | Move item to cart                  | ✓         |
| `GET /checkout`                         | Get checkout session               | ✓         |
| `POST /checkout/add`                    | Create payment intent (Stripe)     | ✓         |
| `GET /orders`                           | List orders                        | ✓         |
| `POST /orders/confirm`                  | Confirm payment & create order     | ✓         |
| `GET /delivery/get_default_address`     | Default shipping address           | ✓         |
| `POST /overpass/interpreter`            | Search hiking trails               | ✗         |
| `POST /ors/hiking-route`                | Route geometry for the trail map   | ✗         |
| `GET /osm/search`                       | Geocode a place name               | ✗         |
| `GET /open-meteo/forecast`              | Weather forecast                   | ✗         |
| `GET /open-meteo/elevation`             | Elevation data                     | ✗         |
| `POST /ai/suggest`                      | AI gear recommendation             | ✗         |
| `GET /pexels/search`                    | Trail stock photos                 | ✗         |
| `PUT /admin/add/:productId`             | Increase stock for a size          | ✓ (admin) |
| `PUT /admin/decrease/:productId`        | Decrease stock for a size          | ✓ (admin) |
| `DELETE /admin/remove/:productId/:size` | Remove a size from a product       | ✓ (admin) |

---

## 🔐 Authentication & Sessions

Login issues a signed JWT in an httpOnly cookie. On every protected request the
middleware verifies the signature **and** confirms the account still exists in the
database, so a token belonging to a deleted user stops working immediately.

Failures are reported with a code the client acts on:

| Code              | Meaning                              | Client behaviour            |
| ----------------- | ------------------------------------ | --------------------------- |
| `NO_SESSION`      | No cookie sent, visitor is anonymous | Ignored, public pages work  |
| `SESSION_INVALID` | Cookie present but expired, malformed, or the account was removed | Cookie cleared, redirect to `/login` |

Admin routes re-read the role from the database rather than trusting the token,
so revoking an admin takes effect without waiting for the token to expire.

---

## 🤖 AI Gear Recommendation Flow

1. User searches for a trail → resolved via Nominatim geocoding.
2. Trail data fetched from Overpass API. Trail length is summed from that geometry
   locally; OpenRouteService is called only on the trail detail page, to draw the
   route line on the map.
3. Weather forecast pulled from Open-Meteo for the chosen date.
4. On "Get AI Suggestion," Claude receives trail difficulty, weather, and the product catalog, and recommends gear from inventory.

---

## 🎨 Design & Styling

Responsive from mobile (361px+) to desktop (1921px+). Light theme via DaisyUI, with fade-in/slide-in animations and a sticky header that transitions from transparent to white on scroll.

---

## 🧑‍💻 Author

**Denys Herzhyk**
📧 denis.herzhyk@gmail.com

Built as a university project at Ruse University, Ruse, Bulgaria.
