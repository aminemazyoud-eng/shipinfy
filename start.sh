#!/bin/sh
echo "Running Prisma db push..."
./node_modules/.bin/prisma db push --accept-data-loss
echo "Running seed..."
./node_modules/.bin/ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seed skipped (already seeded)"
echo "Starting app..."
node server.js
