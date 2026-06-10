# Frontend — React SPA

Customer and Agent portal for the Support Ticket System.

## Tech Stack

- **Build Tool:** Vite (React 18+)
- **HTTP Client:** Axios (with interceptors)
- **Routing:** React Router v6
- **Styling:** Native CSS
- **Linting:** ESLint
- **Formatting:** Prettier
- **Container:** Docker (multi-stage)

## Project Structure

```
src/
├── main.jsx          # React entry point
├── App.jsx           # Root component
├── index.css         # Global styles
├── pages/            # Page components (login, profile, tickets, etc.)
├── components/       # Shared components
├── hooks/            # Custom React hooks
├── context/          # React Context (auth, tickets, etc.)
├── api/              # Axios API client and interceptors
└── utils/            # Helper functions
```

## Setup

```bash
npm install
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
```

## Environment Variables

Create `.env.local`:

```
VITE_ENV=development
API_BASE_URL=http://localhost:3000
```
## CI/CD

## Docker

```bash
docker build -t frontend-react-spa .
docker run -p 5173:5173 frontend-react-spa
```

## Development Notes

- JWT stored in localStorage (Phase 4: migrate to httpOnly cookies)
- All API calls through Axios interceptors
- Role-based route protection via PrivateRoute wrapper
