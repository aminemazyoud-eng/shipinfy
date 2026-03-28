-- Idempotent table creation for Supabase deployment
-- Uses IF NOT EXISTS to safely run on every container start

CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_name_key" ON "Warehouse"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_code_key" ON "Warehouse"("code");

CREATE TABLE IF NOT EXISTS "Store" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "destinationDistrict" TEXT NOT NULL,
    "destinationAddressLatitude" DOUBLE PRECISION NOT NULL,
    "destinationAddressLongitude" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CsvExport" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "nbTournees" INTEGER NOT NULL,
    "csvContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsvExport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StoreContact" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "destinationFirstname" TEXT NOT NULL,
    "destinationLastname" TEXT NOT NULL,
    "destinationEmailAddress" TEXT NOT NULL,
    "destinationMobileNumber" TEXT NOT NULL,
    CONSTRAINT "StoreContact_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (safe to re-add with DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Store_warehouseId_fkey'
    ) THEN
        ALTER TABLE "Store" ADD CONSTRAINT "Store_warehouseId_fkey"
        FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StoreContact_storeId_fkey'
    ) THEN
        ALTER TABLE "StoreContact" ADD CONSTRAINT "StoreContact_storeId_fkey"
        FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
