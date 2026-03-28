-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "destinationDistrict" TEXT NOT NULL,
    "destinationAddressLatitude" DOUBLE PRECISION NOT NULL,
    "destinationAddressLongitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsvExport" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "nbTournees" INTEGER NOT NULL,
    "csvContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsvExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreContact" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "destinationFirstname" TEXT NOT NULL,
    "destinationLastname" TEXT NOT NULL,
    "destinationEmailAddress" TEXT NOT NULL,
    "destinationMobileNumber" TEXT NOT NULL,

    CONSTRAINT "StoreContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreContact" ADD CONSTRAINT "StoreContact_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
