# UK Job Scraper

A cross-platform desktop application for scraping job listings from major UK career sites and exporting them to Excel.

## Features

- **Multi-site scraping** — Indeed UK, Reed, Totaljobs, CV-Library, LinkedIn, Glassdoor
- **Keyword-based search** with filters for salary, contract type, work mode, and date posted
- **Excel & CSV export** with formatted columns, clickable links, and auto-filters
- **Search profiles** — save and reuse your search configurations
- **Scheduled scraping** — automate searches with cron-based scheduling
- **Desktop notifications** when new jobs are found
- **Duplicate detection** via SQLite database with URL-based deduplication
- **Rate limiting** with exponential backoff, User-Agent rotation, and proxy support
- **Dark/Light theme** toggle
- **System tray** support for background operation

## Tech Stack

- **Framework:** Electron
- **Frontend:** React + TypeScript + Tailwind CSS
- **Scraping:** Cheerio (HTML parsing) + fetch
- **Database:** SQLite (better-sqlite3)
- **Excel Export:** ExcelJS
- **Scheduling:** node-cron
- **Build:** Vite (renderer) + TypeScript (main process) + electron-builder

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Both
npm run dist:all
```

## Project Structure

```
uk-job-scraper/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # App entry point
│   │   ├── preload.ts     # Context bridge
│   │   ├── database.ts    # SQLite operations
│   │   ├── exporter.ts    # Excel/CSV export
│   │   ├── scheduler.ts   # Cron scheduling
│   │   ├── logger.ts      # Winston logger
│   │   └── scraper/       # Scraping engine
│   │       ├── engine.ts
│   │       ├── base-scraper.ts
│   │       ├── rate-limiter.ts
│   │       ├── user-agents.ts
│   │       └── sites/     # Per-site scrapers
│   ├── renderer/          # React frontend
│   │   ├── App.tsx
│   │   ├── pages/         # Page components
│   │   ├── components/    # Shared components
│   │   └── styles/        # Tailwind CSS
│   └── shared/            # Shared types
│       └── types.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig*.json
```

## Usage

1. **Quick Search** — Enter keywords and filters, select job sites, and click "Start Search"
2. **Search Profiles** — Save your search configurations for reuse
3. **Schedules** — Set up automated scraping (e.g., daily at 9 AM)
4. **Export** — Download results as formatted Excel or CSV files

## Legal Notice

This tool is for personal use only. Please respect each website's Terms of Service and robots.txt. Use reasonable request delays to avoid overloading servers.

## License

MIT
