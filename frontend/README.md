# PostgreSQL Database Manager Frontend

A modern Next.js 14 application for managing PostgreSQL databases with a beautiful UI.

## Features

- View and manage databases
- Create, view, and manage tables
- Execute SQL queries
- View database statistics and performance metrics
- Real-time data updates with React Query
- Beautiful UI with Tailwind CSS
- Data visualization with Recharts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Zustand

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Copy the environment variables:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your configuration (if needed)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will run on [http://localhost:3001](http://localhost:3001) to avoid conflict with the backend API on port 3000.

## Project Structure

```
frontend/
├── app/              # Next.js 14 app directory
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   ├── globals.css   # Global styles
│   └── databases/    # Database management pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── layout/      # Layout components
├── lib/             # Utility functions and API client
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## API Integration

The frontend is configured to communicate with the backend API running on `http://localhost:3000`. The API endpoints are defined in `/lib/api.ts`.

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3001
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Key Features Implementation

### Database Management
- List all databases
- Create new databases
- Delete databases
- View database details and statistics

### Table Management
- List tables in a database
- Create new tables
- View table schema and data
- Delete tables

### Query Execution
- Execute SQL queries
- View query results in a table format
- Query history

### Statistics Dashboard
- Database size metrics
- Connection statistics
- Performance metrics
- Cache hit ratios
- Transaction rates

## Development Notes

- The app uses Next.js 14 with the App Router
- Server Components are used where possible for better performance
- Client Components are marked with 'use client' directive
- React Query handles all data fetching and caching
- Tailwind CSS is used for styling with custom PostgreSQL theme colors