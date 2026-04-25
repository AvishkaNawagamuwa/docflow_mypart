<<<<<<< HEAD
# Doc Flow

A workflow-driven document operations app with a React/Vite frontend and a Django backend. The UI includes role-based dashboards, a workflow builder, document management screens, an external portal, and admin tools for configuring the system.

## Repository Layout

- `frontend/` - React + TypeScript single-page application
- `backend/Doc-Flow-Backend-main/` - Django project scaffold
- `backend/supabase/` - Supabase configuration used by the backend workspace

## What The App Does

- Role-based access for staff, approver, supervisor, admin, and external users
- Dashboard views for different roles
- Workflow management and workflow builder canvas
- Workflow instance tracking and document handling
- Document type, roles/users, notifications, settings, and analytics configuration pages
- External portal for login, submission, dashboard, and submission detail views
- Node-based workflow configuration for start, task, decision, merge, parallel split, parallel join, timer, escalation, notification, and end nodes

## Frontend Stack

- Vite
- React 18
- TypeScript
- React Router
- React Query
- React Flow
- Tailwind CSS
- shadcn/ui
- Recharts
- Supabase client

## Frontend To Backend Integration

The workflow builder now posts workflow definitions to the Django API.

- Set `VITE_API_BASE_URL` in `frontend/.env` or `frontend/.env.local`
- Default local value: `http://localhost:8000/api`
- The builder Save Draft and Publish actions send the same workflow definition JSON that the canvas exports
- Django stores the raw definition plus normalized workflow nodes, transitions, and runtime tables

## Backend Stack

- Django
- Python
- ASGI/WSGI project layout under `config/`

## Frontend Setup

From `frontend/`:

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run build
npm run lint
npm run test
npm run test:watch
npm run preview
```

## Backend Setup

From `backend/Doc-Flow-Backend-main/`:

```bash
python -m venv .venv
.venv\Scripts\activate
python manage.py runserver
```

Notes:

- Install the backend dependencies from `backend/Doc-Flow-Backend-main/requirements.txt` before running the server.
- The Django entry point is `manage.py` and the project settings module is `config.settings`.
- The backend uses MySQL via environment variables, so copy `backend/Doc-Flow-Backend-main/.env.example` into your local `.env` file and fill in the AWS RDS credentials.

## Main Frontend Pages

- Login
- Staff Dashboard
- Approver Dashboard
- Supervisor Dashboard
- Admin Dashboard
- Workflows
- Workflow Builder
- Instances
- Documents
- Document Types
- Roles and Users
- Notifications
- Settings
- Dashboard Templates
- Dashboard Builder
- Dashboard Preview
- Analytics Configuration
- External Login
- External Dashboard
- External Submission
- External Submission Detail

## Workflow Builder Notes

The workflow builder supports node-specific configuration panels so each node type can expose only the controls it needs. Current panels include:

- Start node: Basic, Trigger Method, Notification
- Task node: Basic, Approval, SLA, Escalation, Notify, Advanced
- Decision node: Basic, Decision with all branch
- Merge node: Basic with merge behavior information
- Parallel Split node: Basic with split behavior information
- Parallel Join node: Basic with join behavior information
- End node: Basic, Notify

## Development Notes

- The frontend uses mock data for many screens, which keeps the UI usable without a live backend for every feature.
- Shared UI primitives live in `frontend/src/components/ui/`.
- Workflow-related types live in `frontend/src/types/workflow.ts`.
- Builder-specific components live under `frontend/src/components/builder/`.

## Deployment

### Frontend

Build the app with `npm run build` and deploy the generated Vite output from `frontend/dist`.

### Backend

Deploy the Django project from `backend/Doc-Flow-Backend-main/` using your preferred WSGI or ASGI hosting setup.

## License

No license file is included in this snapshot.
=======
# docflow_mypart
>>>>>>> 9dc03bf8c82eb98757242520caa729b20fd97aa6
