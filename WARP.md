# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview

- Stack: Node.js (ESM) + Express + Drizzle ORM (PostgreSQL via Neon) + Winston + Zod + Arcjet security middleware
- Entrypoint: src/index.js loads src/server.js which starts the HTTP server using src/app.js
- HTTP: listens on PORT (default 3000); /health returns 200 OK
- Module aliases (Node “imports” map): #config/_, #controllers/_, #middleware/_, #models/_, #routes/_, #services/_, #utils/_, #validations/_

Common commands

Use npm ci for reproducible installs when package-lock.json is present.

- Install dependencies
  - npm ci
- Run locally (watch)
  - npm run dev
- Run in production mode
  - npm start
- Lint
  - npm run lint
  - npm run lint:fix
- Format
  - npm run format:check
  - npm run format
- Database (Drizzle)
  - Generate SQL from models: npm run db:generate
  - Apply migrations: npm run db:migrate
  - Drizzle Studio: npm run db:studio

Docker workflows

These compose files rely on environment files for configuration.

- Development (Node watch, Neon local proxy)
  - docker compose -f docker-compose.dev.yml up --build
  - Environment file: .env.development
- Production (optimized, healthcheck on /health)
  - docker compose -f docker-compose.prod.yml up --build -d
  - Environment file: .env.production

Environment configuration

- DATABASE_URL: PostgreSQL connection string (Neon serverless). In development, src/config/database.js switches Neon to a local proxy if NODE_ENV=development.
- ARCJET_KEY: Required by Arcjet (src/config/arcjet.js)
- JWT_SECRET, JWT_EXPIRES_IN: Used by JWT utilities (src/utils/jwt.js)
- NODE_ENV: development | production
- PORT: defaults to 3000
- LOG_LEVE: logger level (note: consumed as LOG_LEVE in src/config/logger.js)

High-level architecture

- Runtime and bootstrap
  - src/index.js loads dotenv and starts the server via ./server.js
  - src/server.js binds Express app on PORT
  - src/app.js constructs the Express app: helmet, cors, express.json/urlencoded, cookie-parser
  - Morgan logs are routed into Winston (combined/errors to files, console in non-production)

- Security and rate limiting (Arcjet)
  - src/config/arcjet.js defines a shield, bot detection (allowlisting search/previews), and a sliding window rate limit
  - src/middleware/security.middleware.js adapts the rate limit by role (guest/user/admin), denies on bot/shield/rate limit reasons, and logs context; applied globally before routes

- Routing and request flow
  - app mounts:
    - GET / and GET /health
    - /api/auth -> src/routes/auth.routes.js
    - /api/users -> src/routes/users.routes.js
  - Controllers validate input with Zod (src/validations), call services, set/clear HTTP-only cookies via src/utils/cookies.js, and sign JWT tokens using src/utils/jwt.js

- Data layer (Drizzle + Neon)
  - src/config/database.js initializes Neon HTTP client and Drizzle ORM; in development, switches Neon to local proxy settings
  - Schema: src/models/user.model.js defines users table (id, name, email unique, password, role, created_at, updated_at)
  - Drizzle config: drizzle.config.js points schema to ./src/models/\*.js and outputs migrations to ./drizzle
  - Services use Drizzle’s query builder (e.g., eq) for selects/inserts and encapsulate bcrypt hashing/comparison

- Logging
  - Winston logger (src/config/logger.js) writes to logs/ and to console in non-production; Morgan HTTP logs are piped to Winston

Notes on tests

- No test framework or npm test scripts are present. Running a single test is not applicable in the current setup.

Additional context present

- Dockerfile (multi-stage: base/development/production), exposes 3000 and healthchecks /health
- docker-compose.dev.yml runs a Neon local proxy (neondatabase/neon_local) and a dev app container with file mounts
- docker-compose.prod.yml runs the production target with healthcheck and resource limits
- No README, CLAUDE, Cursor, or Copilot instruction files were found in this repository at the time of writing.
