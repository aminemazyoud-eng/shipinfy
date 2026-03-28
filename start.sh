#!/bin/sh
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Running seed..."
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seed skipped (already seeded)"
echo "Starting app..."
node server.js
