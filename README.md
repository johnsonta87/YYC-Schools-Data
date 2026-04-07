# YYC Schools Data

A web app that displays a browsable, filterable list of Calgary schools sourced from the [City of Calgary Open Data portal](https://data.calgary.ca/resource/fd9t-tdn2).

## Features

- 📋 Lists Calgary schools with name, board, grades served, address, phone, email, and a Google Maps link
- 🔍 Filter by **school board**, **grades** (Elementary / Junior High / Senior High), and **city quadrant** (NE / NW / SE / SW)
- 🌙 Light / dark mode toggle
- ⚡ Built with React 19, TanStack Router, TanStack Query, Tailwind CSS v4, and Vite

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, Tailwind CSS v4, Lucide React |
| Routing | TanStack Router |
| Data fetching | TanStack Query |
| Backend / DB | Convex |
| Build tool | Vite |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Convex](https://convex.dev) account
- *(Optional)* A [City of Calgary Open Data](https://data.calgary.ca) app token for higher rate limits

### Installation

```bash
git clone https://github.com/your-username/yyc-schools-data.git
cd yyc-schools-data
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Optional – increases the rate limit for the Calgary Open Data API
VITE_CALGARY_APP_TOKEN=your_app_token_here
```

### Running the App

```bash
npm run dev
```

This starts both the Vite dev server and the Convex dev backend concurrently.

| Script | Description |
|---|---|
| `npm run dev` | Start Convex + Vite dev servers |
| `npm run build` | Production build |
| `npm run lint` | TypeScript + ESLint checks |
| `npm run format` | Format code with Prettier |

## Data Source

School data is fetched at runtime from the City of Calgary's Open Data API:

```
POST https://data.calgary.ca/api/v3/views/fd9t-tdn2/query.json
```

The app normalises the raw API response to a consistent `SchoolItem` shape, handling multiple field-name conventions across different dataset versions.

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # App header with theme toggle
│   ├── SchoolItem.tsx      # Individual school card
│   ├── SchoolsList.tsx     # List renderer + data normalisation
│   ├── SchoolsFilter.tsx   # Sidebar filter panel
│   └── ThemeSwitcher.tsx   # Light / dark mode button
├── hooks/
│   └── useSchools.ts       # Data fetching hook (TanStack Query)
└── routes/
    └── index.tsx           # Home page route
```

## License

MIT
