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

CREATE TABLE IF NOT EXISTS "ShipperReference" (
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipperReference_pkey" PRIMARY KEY ("code")
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

CREATE TABLE IF NOT EXISTS "DeliveryReport" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "DeliveryReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeliveryOrder" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "externalReference" TEXT,
    "shipperReference" TEXT,
    "carrierReference" TEXT,
    "pickupTimeStart" TIMESTAMP(3),
    "deliveryTimeStart" TIMESTAMP(3),
    "deliveryTimeEnd" TIMESTAMP(3),
    "dateTimeWhenOrderSent" TIMESTAMP(3),
    "dateTimeWhenAssigned" TIMESTAMP(3),
    "dateTimeWhenInTransport" TIMESTAMP(3),
    "dateTimeWhenStartDelivery" TIMESTAMP(3),
    "dateTimeWhenDelivered" TIMESTAMP(3),
    "dateTimeWhenNoShow" TIMESTAMP(3),
    "dateTimeLastUpdate" TIMESTAMP(3),
    "shippingWorkflowStatus" TEXT,
    "paymentOnDeliveryAmount" DOUBLE PRECISION,
    "destinationFirstname" TEXT,
    "destinationLastname" TEXT,
    "destinationCityCode" TEXT,
    "destinationLongitude" DOUBLE PRECISION,
    "destinationLatitude" DOUBLE PRECISION,
    "originHubName" TEXT,
    "originHubCode" TEXT,
    "originHubCity" TEXT,
    "originHubLongitude" DOUBLE PRECISION,
    "originHubLatitude" DOUBLE PRECISION,
    "sprintName" TEXT,
    "sprintGeoLongitude" DOUBLE PRECISION,
    "sprintGeoLatitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeliveryOrder_reportId_idx" ON "DeliveryOrder"("reportId");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_shippingWorkflowStatus_idx" ON "DeliveryOrder"("shippingWorkflowStatus");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_dateTimeWhenOrderSent_idx" ON "DeliveryOrder"("dateTimeWhenOrderSent");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_deliveryTimeStart_idx" ON "DeliveryOrder"("deliveryTimeStart");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_sprintName_idx" ON "DeliveryOrder"("sprintName");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_originHubName_idx" ON "DeliveryOrder"("originHubName");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DeliveryOrder_reportId_fkey'
  ) THEN
    ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "DeliveryReport"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ScheduledReport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "emails" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);
