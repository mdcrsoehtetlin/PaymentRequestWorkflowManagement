# Database Migrations

This folder stores TypeORM migrations for managing PostgreSQL schemas.
Migrations are executed via CLI commands:
- Generate: `npm run migration:generate -- src/database/migrations/MigrationName`
- Run: `npm run migration:run`
- Revert: `npm run migration:revert`
