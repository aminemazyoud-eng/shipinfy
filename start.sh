#!/bin/sh
echo "Running Prisma migrate deploy..."
./node_modules/.bin/prisma migrate deploy
echo "Running seed..."
./node_modules/.bin/ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seed skipped (already seeded)"
echo "Starting app..."
node server.js
