#!/bin/sh
set -e

# Export all variables from .env.docker safely
if [ -f /app/.env.docker ]; then
  echo "Loading environment from .env.docker..."
  # Use a safer method to export variables (handles spaces and special characters)
  set -a
  . /app/.env.docker
  set +a
else
  echo "Warning: .env.docker not found, using environment variables from docker-compose"
fi

echo "Waiting for database to be ready..."
# Wait for database to be actually ready (healthcheck might not be enough)
until npx prisma db push --accept-data-loss --skip-generate 2>/dev/null || [ $? -eq 0 ]; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Running database migrations..."
# Apply any pending migrations to the database
npx prisma migrate deploy || {
  echo "Migration failed, attempting to continue anyway..."
}

# Execute the main application command (which is "node server.js" from the CMD instruction)
echo "Starting Node.js server..."
exec "$@"