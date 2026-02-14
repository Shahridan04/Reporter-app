# CommunityFix (Reporter App)

CommunityFix is a platform for neighbors to report issues, track their resolution, and fix them together. It gamifies civic engagement by awarding points and badges for reports and helpful comments.

## Features

-   **Report Issues**: Users can submit reports with details, location, and images.
-   **Feed**: View a feed of reports from the community.
-   **Interaction**: Like, comment, and follow reports to stay updated.
-   **Gamification**: Earn points and badges (e.g., First Report, Helper) for active participation.
-   **Profile**: View your contributions and achievements.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **Backend/Database**: Supabase
-   **Maps**: Leaflet / React Leaflet
-   **State Management**: React Query

## Getting Started

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm or yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    npm install
    ```

### Environment Variables

1.  Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

2.  Fill in your Supabase credentials in `.env`:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

### Database Setup

Run the SQL scripts located in the root directory in your Supabase SQL Editor in the following order:

1.  `supabase_schema.sql` (Tables and initial setup)
2.  `supabase_tables.sql` (RLS policies and additional tables)
3.  `supabase_storage.sql` (Storage bucket configuration)
4.  `supabase_notifications.sql` (Notification system triggers)

### Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

### Vercel

The app is ready to be deployed on Vercel.

1.  Import the project into Vercel.
2.  Add the Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
3.  **Important**: Configure Supabase Redirect URLs.
    -   Go to Supabase Dashboard -> Authentication -> URL Configuration.
    -   Add your Vercel deployment URL (e.g., `https://your-project.vercel.app`) to the **Redirect URLs**.
    -   Also add `http://localhost:5173` for local development.

## License

MIT
