Recruitment Management System
A full-stack recruitment workflow application for managing job requisitions, candidates, applications, screening, interviews, feedback, and offers. The project includes a React-based operations dashboard and a Node.js REST API backed by MongoDB.
Features
- Requisitions: Create and manage job requisitions, approval and lifecycle actions.
- Candidates: Maintain candidate profiles and search candidate records.
- Applications: Link candidates to requisitions, manage screening and application stages.
- Interviews: Schedule interviews, assign interview panels, and manage interview status.
- Feedback: Capture structured interviewer feedback and recommendations.
- Offers: Manage offer creation, approval, and candidate response lifecycle.
- Interviewers: Maintain interviewer profiles and availability.
- Dashboard: View recruitment KPIs and charts.
- Authentication: JWT-based login and protected operations; bootstrap setup for the initial administrator.
- Demo mode: Explore the UI with sample data where supported.
- Synthetic data: Generate reproducible recruitment data and validation outputs (see backend seed/documentation).
Architecture
recruitment-management-project/
├── recruitment-backend/
│   ├── server.js
│   ├── src/
│   └── docs/
└── recruitment-frontend/
    ├── src/
    └── docs/
- Frontend: React + Vite + Material UI + Recharts + React Router + Axios.
- Backend: Node.js + Express + Mongoose + JWT + Zod.
- Database: MongoDB; local development uses a single-node replica set (rs0) for transaction support.
Architecture documentation:
- [Backend Architecture](recruitment-backend/docs/backend-architecture.md)
- [Database Architecture](recruitment-backend/docs/database-architecture.md)
- [Frontend Architecture](recruitment-frontend/docs/frontend-architecture.md)
Adjust the documentation links if you keep the architecture files in a different folder.

Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB installed locally or a MongoDB deployment
- Git
Getting Started
1. Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
2. Configure the backend
cd recruitment-backend
npm install
Copy .env.example to .env and configure the values:
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/<database-name>?replicaSet=rs0
JWT_SECRET=<generate-a-strong-random-secret>
BOOTSTRAP_ADMIN_SETUP_KEY=<generate-a-different-strong-random-secret>
Generate a random secret with Node.js:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Generate separate values for JWT_SECRET and BOOTSTRAP_ADMIN_SETUP_KEY. Never commit .env.

Start the backend:
npm run dev
Health endpoint:
GET http://localhost:5000/api/health
3. Configure the frontend
Open a second terminal:
cd recruitment-frontend
npm install
Create a frontend .env file (if required) and set:
VITE_API_URL=http://localhost:5000/api
Start the frontend:
npm run dev
Vite prints the local URL, typically:
http://localhost:5173
MongoDB Replica Set (Local Development)
Transactions require replica-set mode. Configure your MongoDB server (mongod.cfg) with:
replication:
  replSetName: rs0
Restart the MongoDB service, then initialize the replica set once in mongosh:
rs.initiate()
rs.status()
Confirm that a member reports PRIMARY. Use replicaSet=rs0 in the backend connection URI. Do not run rs.initiate() again after successful initialization.
API Modules
The backend exposes recruitment API modules for:
- Authentication
- Requisitions
- Candidates
- Applications
- Interviewers
- Interviews
- Feedback
- Offers
- Health and demo data
Use the backend route files or API documentation for exact endpoints and payloads.
Synthetic Data and Validation
The assessment dataset is intended to be reproducible and synthetic.
- Keep the generator seed fixed when reproducing a dataset.
- Use generated exports and ground-truth files for validation/reconciliation.
- Run the backend's seed and validation scripts as documented in recruitment-backend/src/seed/ and backend documentation.
- Do not use real candidate personal information in synthetic fixtures.
Security Notes
- .env files and secrets must remain untracked.
- Never expose MongoDB credentials, JWT secrets, or bootstrap keys in frontend code.
- The backend must enforce authorization; frontend role-based visibility is not a security boundary.
- Disable or secure bootstrap-admin setup after the initial administrator is created.
- Configure backend CORS for the frontend origin when deploying.
Development
# Backend
cd recruitment-backend
npm run dev

# Frontend (in a separate terminal)
cd recruitment-frontend
npm run dev
Build Frontend
cd recruitment-frontend
npm run build
npm run preview
Documentation
Keep project documentation in the respective docs/ folders:
- Backend architecture
- Database architecture
- Frontend architecture
- Data dictionary
- Dataset generation and validation notes
License
Add a license before distributing this project publicly. Until a license is added, all rights are reserved by the copyright holder.
