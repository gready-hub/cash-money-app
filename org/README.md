# Cash Money - Full Stack Application

A self-employed income and expense tracking application for UK tax purposes, built with the Spartan Stack.

## Description

This application supports tracking spending and income as a self-employed individual in the United Kingdom.

### Features
- Import bank statements from CSV files
- Categorise transactions
- Generate reports on spending and income
- Visualise data with charts and graphs

## Technology Stack

Built with the **Spartan Stack**:
- **Nx** - Monorepo management and build system
- **AnalogJS** - Full-stack Angular meta-framework
- **Angular** - Frontend framework
- **tRPC** - End-to-end typesafe APIs
- **Drizzle ORM** - TypeScript ORM
- **PostgreSQL** - Database (self-hosted, no Supabase)
- **TailwindCSS** - Utility-first CSS framework

📖 [Spartan Stack Documentation](https://spartan.ng/stack/technologies)

## Prerequisites

- Node.js (see `.nvmrc` for version)
- npm or pnpm
- Docker (for local database)
- Git

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd org

# Install Node.js version (using nvm)
nvm install

# Install dependencies
npm install --legacy-peer-deps
# or
pnpm install
```

## Database Setup

This project uses **PostgreSQL** running in Docker locally, with support for future migration to a self-hosted Synology NAS.

### Local Development Setup

1. **Start PostgreSQL container:**
   ```bash
   docker compose up -d
   ```

2. **Verify container is running:**
   ```bash
   docker compose ps
   ```

3. **View database logs:**
   ```bash
   docker compose logs postgres
   ```

4. **Environment configuration:**
   The `.env` file contains the database connection string:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cash_money"
   ```

### Database Management

**Stop the database:**
```bash
docker compose down
```

**Stop and remove all data:**
```bash
docker compose down -v
```

**Restart the database:**
```bash
docker compose restart postgres
```

### Database Schema

The initial schema is located in `db/init/01-schema.sql` and includes:
- `note` table (example from Spartan Stack)
- Prepared structure for future tables:
  - `transactions` - Bank transactions
  - `categories` - Transaction categories
  - `bank_statements` - Imported CSV files
  - `reports` - Generated financial reports

The schema is automatically initialized when the Docker container first starts.

## NAS Migration

When ready to migrate to your Synology NAS:

### 1. Deploy PostgreSQL on NAS

Copy `docker-compose.yml` to your NAS and run:
```bash
docker compose up -d
```

### 2. Update Environment Variables

Update `.env` file with your NAS IP address:
```
DATABASE_URL="postgresql://postgres:your-secure-password@your-nas-ip:5432/cash_money"
```

### 3. Security Considerations

- Update `POSTGRES_PASSWORD` in `docker-compose.yml` to a secure password
- Consider enabling SSL/TLS for database connections
- Set up automated backups on the NAS
- Configure firewall rules to restrict database access

### 4. Data Migration (if needed)

```bash
# Export from local
docker compose exec postgres pg_dump -U postgres cash_money > backup.sql

# Import to NAS
psql -h your-nas-ip -U postgres cash_money < backup.sql
```


## Development Workflow

### Running the Application

**Start development server:**
```bash
npx nx serve cash-money
```

The application will be available at `http://localhost:4200`

**Build for production:**
```bash
npx nx build cash-money
```

**Run production build:**
```bash
node dist/cash-money/analog/server/index.mjs
```

### Running Tests

**Unit tests:**
```bash
npx nx test cash-money
```

**E2E tests:**
```bash
npx nx e2e cash-money-e2e
```

### Code Quality

**Lint:**
```bash
npx nx lint cash-money
```

**Format code:**
```bash
npx prettier --write .
```

## Project Structure

```
org/
├── cash-money/              # Main application
│   ├── src/
│   │   ├── app/            # Angular components and pages
│   │   ├── server/         # Backend tRPC routes
│   │   │   └── trpc/       # tRPC configuration
│   │   └── db.ts           # Database connection
│   └── ...
├── cash-money-e2e/         # E2E tests
├── db/
│   └── init/               # Database initialization scripts
│       └── 01-schema.sql
├── docker-compose.yml      # PostgreSQL container configuration
├── .env                    # Environment variables (not in git)
└── README.md
```

## Rebuilding from Scratch

If you need to completely rebuild the project:

1. **Remove all dependencies and builds:**
   ```bash
   rm -rf node_modules dist .nx
   docker compose down -v
   ```

2. **Reinstall dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Restart database:**
   ```bash
   docker compose up -d
   ```

4. **Verify setup:**
   ```bash
   docker compose ps
   npx nx serve cash-money
   ```

## Troubleshooting

### Database Connection Issues

**Check if PostgreSQL is running:**
```bash
docker compose ps
```

**View database logs:**
```bash
docker compose logs postgres
```

**Restart database:**
```bash
docker compose restart postgres
```

### Node Module Issues

If you encounter peer dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### Port Already in Use

If port 5432 or 4200 is already in use:

**For database (5432):**
Update `docker-compose.yml` to use a different port:
```yaml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

Then update `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/cash_money"
```

**For dev server (4200):**
```bash
npx nx serve cash-money --port 4201
```

## Additional Resources

- [Spartan Stack Documentation](https://spartan.ng)
- [AnalogJS Documentation](https://analogjs.org)
- [Nx Documentation](https://nx.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [tRPC Documentation](https://trpc.io)
- [TailwindCSS Documentation](https://tailwindcss.com)
