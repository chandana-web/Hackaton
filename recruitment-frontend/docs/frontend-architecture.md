# Frontend Architecture — Recruitment Management System

## 1. Overview

The frontend is a single-page application (SPA) built with React, Vite, Material UI (MUI), React Router and Axios. It provides a dashboard and operational screens for the recruitment workflow. It supports **Demo mode** (read-only sample data) and **API mode** (requests to the Express backend, with JWT authentication).

## 2. Technology Stack

- React 18
- Vite 6 (development server and production bundler)
- Material UI v6 and MUI Icons
- Recharts (dashboard visualizations)
- React Router DOM v7 (client-side navigation)
- Axios (HTTP client)
- CSS (`src/styles.css`) for application-specific layout and chart styling

## 3. Application Structure

```text
frontend/
├── index.html
├── package.json
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api.js
│   ├── dataMode.js
│   ├── dataSource.js
│   ├── styles.css
│   ├── components/
│   │   ├── DataTable.jsx
│   │   ├── ResourcePage.jsx
│   │   └── Ui.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Requisitions.jsx
│       ├── Candidates.jsx
│       ├── Applications.jsx
│       ├── Interviewers.jsx
│       ├── Interviews.jsx
│       ├── Feedback.jsx
│       ├── Offers.jsx
│       └── Users.jsx
└── dist/                 # Vite production build output (generated)
```

## 4. Application Bootstrap and Theme

`src/main.jsx` is the entry point. It mounts React into `index.html` and wraps the application with:

- `BrowserRouter` for route handling
- `ThemeProvider` with a shared MUI theme
- `CssBaseline` for consistent browser defaults

The theme defines the primary/secondary palette, page and surface colors, typography, rounded corners and shared component styling.

## 5. Layout and Navigation

`src/App.jsx` contains the application shell:

- Responsive navigation drawer and app bar
- Dashboard and recruitment module navigation
- Current page title and user/profile area
- Demo/API mode selection
- Login and bootstrap administrator dialogs
- Role-aware navigation visibility
- Route configuration and page rendering

Main navigation includes Dashboard, Requisitions, Candidates, Applications, Interviews, Feedback and Offers. System administrators also have Interviewers and Users screens.

## 6. Pages and Responsibilities

| Page | Responsibility |
|---|---|
| Dashboard | KPI cards, requisition/application summaries and Recharts visualizations |
| Requisitions | Create, view and manage job requisitions and their workflow actions |
| Candidates | Candidate listing, search and candidate operations |
| Applications | Application listing, screening and stage-related actions |
| Interviewers | Interviewer profiles and availability management |
| Interviews | Interview scheduling, panel and interview lifecycle operations |
| Feedback | Structured interviewer feedback |
| Offers | Offer creation, approvals and candidate offer lifecycle |
| Users | User administration (system-admin area) |

## 7. Shared Components

- `components/DataTable.jsx`: reusable data table and status display (`StatusChip`).
- `components/ResourcePage.jsx`: common resource-page pattern for listing records and performing configured actions.
- `components/Ui.jsx`: shared UI helpers/components used by screens.
- `styles.css`: global layout, responsive behavior, dashboard panels and chart presentation.

Page-specific configuration is used to keep CRUD/resource screens consistent.

## 8. API and Data Flow

```text
Page / Dashboard
      |
      v
dataSource.js
  ├─ Demo mode → /api/demo-data → local mapping/filtering
  └─ API mode  → api.js → Axios HTTP request
                         |
                         v
                  Express REST API
                         |
                         v
                  MongoDB / Mongoose
```

### `src/api.js`

- Axios instance with configurable base URL.
- Default API base URL: `http://localhost:5000/api`.
- Supports `VITE_API_URL` override.
- Request interceptor attaches `Authorization: Bearer <token>` when a token exists.
- Prevents write operations in Demo mode.
- Response interceptor converts backend validation/error responses into readable messages.

### `src/dataMode.js`

- Persists selected data mode in `localStorage`.
- Stores API JWT in `sessionStorage`.
- Exposes helpers to read/change mode and token.

### `src/dataSource.js`

- Provides a shared resource-fetching abstraction.
- API mode delegates requests to Axios.
- Demo mode loads `/demo-data`, maps related IDs into display-friendly references and serves read-only resource data.
- Applies supported demo filtering/search behavior.

## 9. Authentication and Roles

In API mode, the shell provides login and bootstrap-admin setup flows. On successful authentication, the token is held in session storage and attached to subsequent API calls by the Axios interceptor. The frontend fetches the current user from `/auth/me`.

Role-aware navigation/page access uses roles such as `OPERATIONS_ANALYST`, `INTERVIEWER`, `APPROVER` and `SYSTEM_ADMIN`. This is a UI convenience only; the backend must independently enforce authentication and authorization for protected operations.

## 10. Dashboard and Charts

`pages/Dashboard.jsx` fetches resource data through `dataSource.js` and displays record counts and visual summaries. Recharts components used include:

- `BarChart` / `Bar`
- `LineChart` / `Line`
- `PieChart` / `Pie` / `Cell
- `ResponsiveContainer`
- `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`

Dashboard request failures are surfaced as alerts/errors rather than being treated as successful data loads. A zero count should be interpreted as no records only when the request succeeded and returned an empty collection.

## 11. Environment Configuration

Create `.env` in the frontend root (do not put backend secrets here):

```env
VITE_API_URL=http://localhost:5000/api
```

Only variables prefixed with `VITE_` are exposed to browser code. **Never place `JWT_SECRET`, `BOOTSTRAP_ADMIN_SETUP_KEY`, MongoDB credentials or other server secrets in frontend environment variables.**

## 12. Development and Build

```bash
npm install
npm run dev
```

Build production assets:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Vite writes production assets to `dist/`. Deploy the generated static assets to a static hosting provider or web server; configure the backend API URL and CORS accordingly.

## 13. Security and Operational Notes

- API mode requires a valid backend token for protected endpoints.
- The browser stores the JWT in `sessionStorage`; it is cleared when the browser session ends.
- UI role checks do not replace backend authorization.
- Demo mode is read-only.
- Configure CORS on the backend for the deployed frontend origin.
- Do not commit `.env` files containing secrets.
