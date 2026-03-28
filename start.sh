#!/bin/sh
echo "Creating tables..."
./node_modules/.bin/prisma db execute --file prisma/init-tables.sql --schema prisma/schema.prisma
echo "Running seed..."
./node_modules/.bin/ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seed skipped (already seeded)"
echo "Starting app..."
node server.js
