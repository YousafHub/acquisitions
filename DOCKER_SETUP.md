# Docker Setup for Acquisitions API

This document provides comprehensive instructions for running the Acquisitions API using Docker with different configurations for development and production environments.

## 🏗️ Architecture Overview

### Development Environment

- **Database**: Neon Local (ephemeral branches via Docker)
- **Proxy**: Neon Local container acts as a proxy to your Neon Cloud project
- **Benefits**: Fresh database branches for each development session, no manual cleanup required

### Production Environment

- **Database**: Neon Cloud (serverless PostgreSQL)
- **Configuration**: Direct connection to production Neon database
- **Benefits**: Production-ready scaling, backups, and reliability

## 📋 Prerequisites

### Required Tools

- [Docker](https://docs.docker.com/get-docker/) (v20.0+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- [Neon Account](https://console.neon.tech) with API access

### Required Neon Information

Before starting, gather the following from your [Neon Console](https://console.neon.tech):

1. **NEON_API_KEY**: Generate from Account Settings → API Keys
2. **NEON_PROJECT_ID**: Found in Project Settings → General
3. **PARENT_BRANCH_ID**: Usually your main/production branch ID
4. **DATABASE_URL**: Your production Neon connection string

## 🔧 Setup Instructions

### Step 1: Clone and Prepare Environment

```bash
# Clone your repository (if not already done)
git clone <your-repo-url>
cd acquisitions

# Create environment files from templates
cp .env.development.example .env.development  # If you have a template
cp .env.production.example .env.production    # If you have a template
```

### Step 2: Configure Development Environment

Edit `.env.development` with your Neon credentials:

```bash
# Required: Get from https://console.neon.tech
NEON_API_KEY=your_neon_api_key_here
NEON_PROJECT_ID=your_neon_project_id_here
PARENT_BRANCH_ID=your_parent_branch_id_here

# Database URL (automatically configured for Neon Local)
DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=require

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
JWT_SECRET=dev-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d
```

### Step 3: Configure Production Environment

Edit `.env.production` or set environment variables:

```bash
# Required: Production database URL from Neon Console
export DATABASE_URL="postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Required: Strong JWT secret (generate randomly)
export JWT_SECRET="your-super-secure-production-jwt-secret"

# Optional: Additional production configurations
export NODE_ENV="production"
export PORT="3000"
export LOG_LEVEL="info"
```

## 🚀 Running the Application

### Development Environment (with Neon Local)

#### Quick Start

```bash
# Start development environment with Neon Local
npm run docker:dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml --env-file .env.development up --build
```

#### What This Does:

1. **Starts Neon Local container**: Creates ephemeral database branch from your parent branch
2. **Builds and starts your app**: Connects to the ephemeral database
3. **Runs database migrations**: Applies schema changes to fresh database
4. **Exposes services**: App on `localhost:3000`, Database on `localhost:5432`

#### Development Commands

```bash
# Start development environment
npm run docker:dev

# View logs in real-time
npm run docker:dev:logs

# Stop and clean up (removes ephemeral database)
npm run docker:dev:down

# Run database migrations
npm run docker:migrate:dev

# Access the app
curl http://localhost:3000/health
```

#### Development Workflow

```bash
# 1. Start development environment
npm run docker:dev

# 2. Your app is now running with a fresh database branch
# 3. Make code changes (restart container to see changes)
# 4. Stop environment when done (ephemeral DB is automatically cleaned up)
npm run docker:dev:down
```

### Production Environment (with Neon Cloud)

#### Production Deployment

```bash
# Set environment variables (replace with your values)
export DATABASE_URL="postgres://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
export JWT_SECRET="your-production-jwt-secret"

# Start production environment
npm run docker:prod

# Or using docker-compose directly
docker-compose -f docker-compose.prod.yml up --build -d
```

#### Production Commands

```bash
# Start production environment (detached)
npm run docker:prod

# View logs
npm run docker:prod:logs

# Stop production environment
npm run docker:prod:down

# Run database migrations in production
npm run docker:migrate:prod

# Health check
curl http://localhost:3000/health
```

## 🔍 Monitoring and Debugging

### Health Checks

Both environments include built-in health checks:

```bash
# Application health
curl http://localhost:3000/health

# Docker health status
docker ps  # Shows health status in STATUS column
```

### View Logs

```bash
# Development logs
npm run docker:dev:logs

# Production logs
npm run docker:prod:logs

# Specific service logs
docker-compose -f docker-compose.dev.yml logs neon-local
docker-compose -f docker-compose.dev.yml logs app
```

### Database Access

#### Development (Neon Local)

```bash
# Connect to ephemeral database
docker exec -it acquisitions-neon-local psql postgres://neon:npg@localhost:5432/neondb

# Or using a PostgreSQL client
psql postgres://neon:npg@localhost:5432/neondb?sslmode=require
```

#### Production (Neon Cloud)

```bash
# Use your production connection string
psql "$DATABASE_URL"

# Or use Neon Console SQL Editor
# Visit: https://console.neon.tech
```

## 🛠️ Database Management

### Migrations

```bash
# Development migrations
npm run docker:migrate:dev

# Production migrations
npm run docker:migrate:prod

# Generate new migration
npm run db:generate

# View migration status
npm run db:studio  # Opens Drizzle Studio
```

### Schema Changes

1. Modify your models in `src/models/`
2. Generate migration: `npm run db:generate`
3. Apply to development: `npm run docker:migrate:dev`
4. Test your changes
5. Apply to production: `npm run docker:migrate:prod`

## 🔐 Security Considerations

### Development Security

- Ephemeral databases are automatically cleaned up
- Use development-only JWT secrets
- Neon Local uses self-signed certificates

### Production Security

- Use strong, randomly generated JWT secrets
- Store secrets in environment variables (never in code)
- Enable HTTPS in production (consider adding nginx reverse proxy)
- Use Neon Cloud's built-in security features

## 🚨 Troubleshooting

### Common Issues

#### Neon Local Won't Start

```bash
# Check your credentials
echo $NEON_API_KEY
echo $NEON_PROJECT_ID
echo $PARENT_BRANCH_ID

# Check Docker logs
docker-compose -f docker-compose.dev.yml logs neon-local

# Restart with fresh containers
npm run docker:dev:down
npm run docker:dev
```

#### App Can't Connect to Database

```bash
# Check if Neon Local is healthy
docker ps  # Look for healthy status

# Check network connectivity
docker-compose -f docker-compose.dev.yml exec app ping neon-local

# Verify connection string
docker-compose -f docker-compose.dev.yml exec app env | grep DATABASE_URL
```

#### Production Database Issues

```bash
# Test connection directly
psql "$DATABASE_URL" -c "SELECT version();"

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep DATABASE_URL

# Verify SSL settings
openssl s_client -connect your-neon-host:5432 -starttls postgres
```

#### Port Conflicts

```bash
# If port 5432 is in use (development)
# Option 1: Stop local PostgreSQL
sudo service postgresql stop

# Option 2: Change port in docker-compose.dev.yml
# Change "5432:5432" to "5433:5432"
# Update DATABASE_URL to use port 5433

# If port 3000 is in use
# Change ports in docker-compose files and restart
```

### Clean Up Commands

```bash
# Remove all containers and volumes
npm run docker:clean

# Full Docker cleanup
docker system prune -a -f
docker volume prune -f

# Remove specific project containers
docker-compose -f docker-compose.dev.yml down -v --rmi all
docker-compose -f docker-compose.prod.yml down -v --rmi all
```

## 📚 Additional Resources

### Neon Documentation

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Console](https://console.neon.tech)
- [Neon API Reference](https://api-docs.neon.tech/reference/getting-started-with-neon-api)

### Docker Documentation

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

### Application Stack

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## 🤝 Support

For issues related to:

- **Neon Database**: [Neon Support](https://neon.tech/docs/introduction/support)
- **Application Code**: Create an issue in this repository
- **Docker Setup**: Check the troubleshooting section above

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Development
npm run docker:dev          # Start development environment
npm run docker:dev:down     # Stop and cleanup
npm run docker:dev:logs     # View logs

# Production
npm run docker:prod         # Start production environment
npm run docker:prod:down    # Stop production
npm run docker:prod:logs    # View logs

# Database
npm run docker:migrate:dev  # Run development migrations
npm run docker:migrate:prod # Run production migrations

# Utilities
npm run docker:build        # Build Docker image
npm run docker:clean        # Clean up Docker resources
```

### Environment Variables Quick Setup

```bash
# Development (.env.development)
NEON_API_KEY=your_api_key
NEON_PROJECT_ID=your_project_id
PARENT_BRANCH_ID=your_branch_id

# Production (environment or .env.production)
DATABASE_URL=postgres://user:pass@host.neon.tech/db
JWT_SECRET=your_secret_key
```
