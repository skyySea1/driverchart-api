# API - US DOT Compliance Management System

## Project Structure

```x
api/
├── src/
│   ├── plugins/            # Fastify plugins: JWT, AUTH, CORS, Helmet, Swagger, request-context
│   ├── routes/             # Domain endpoints
│   │   ├── drivers.ts
│   │   ├── documents.ts
│   │   ├── alerts.ts
│   │   └── users.ts
│   ├── schemas/            # Shared Zod schemas
│   │   ├── driver.ts
│   │   ├── document.ts
│   │   ├── alert.ts
│   │   └── user.ts
│   ├── services/           # Business logic and DB integration
│   │   ├── driverService.ts
│   │   ├── documentService.ts
│   │   └── alertService.ts
│   ├── utils/              # Logger, request-id, env validation
│   ├── jobs/               # Cloud Functions / scheduled tasks
│   ├── index.ts            # Fastify bootstrap
│   └── types.ts            # Global types
├── package.json
├── tsconfig.json
└── .env
```

## Elements explanation

- plugins: extra resources and extensions that are registered during init point
- services: define and expose database and logic operations for endpoint handlingt
- schemas: padronize  data typing, map object elements, define expect data
- jobs: routines that work with scheduling on the server
- utils: designed for general use and shared functions like logger, validations, env configs, helpers

## Main Endpoints

| Domain    | Endpoints                                                                            | Notes                              |
| --------- | ------------------------------------------------------------------------------------ | ---------------------------------- |
| Drivers   | GET /drivers, GET /drivers/:id, POST /drivers, PUT /drivers/:id, DELETE /drivers/:id | Full CRUD, Zod validation          |
| Documents | GET /documents, POST /documents, PATCH /documents/:id/status                         | Expiration control, download links |
| Alerts    | GET /alerts, POST /alerts                                                            | Expiration jobs and notifications  |
| Users     | GET /users, POST /users                                                              | Authentication, roles, permissions |

## Key Dependencies

- **Fastify + TypeScript:** Lightweight, secure, and auditable framework
- **Zod:** Request/response validation and OpenAPI generation
- **Fastify Plugins:** JWT, Helmet, CORS, Swagger, request-context
- **Logging:** Pino structured logging with request-id
- **Cloud Functions:** Scheduled jobs (document expiration, alert triggers)
- **Env:** dotenv for local, Fastify Env/Zod for production

## How to Test the API

1. Start the server:

   ```bash
   pnpm ts-node src/index.ts
   ```

2. Example endpoint test:

   ```bash
   curl -X POST http://localhost:3000/drivers \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","licenseNumber":"ABC123"}'
   ```

## Next Steps

- Integrate JWT and authentication
- Create Cloud Functions / scheduled jobs
- Add complete OpenAPI / Swagger documentation
- Expand routes for documents, alerts, users
- Configure logger with request-id
- Integrate Vue frontend via Axios or fetch
