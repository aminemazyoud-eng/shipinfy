import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const dbPath = path.join(__dirname, 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  const wh = await prisma.warehouse.upsert({
    where: { name: 'CARREFOUR' },
    update: {},
    create: { name: 'CARREFOUR', code: 'WAREHOUSE CENTRAL' },
  })

  const storesData = [
    { destinationAddress: 'Carrefour Market Bourgogne', destinationDistrict: 'CASABLANCA', destinationAddressLatitude: 33.597163, destinationAddressLongitude: -7.643238 },
    { destinationAddress: 'Carrefour Market Ain Sebaa', destinationDistrict: 'CASABLANCA', destinationAddressLatitude: 33.597283, destinationAddressLongitude: -7.723066 },
    { destinationAddress: 'Carrefour Market Maarif', destinationDistrict: 'CASABLANCA', destinationAddressLatitude: 33.580223, destinationAddressLongitude: -7.643363 },
    { destinationAddress: 'Carrefour Market Panoramique', destinationDistrict: 'CASABLANCA', destinationAddressLatitude: 33.548184, destinationAddressLongitude: -7.645161 },
    { destinationAddress: 'Carrefour Market Bouskoura Ville', destinationDistrict: 'CASABLANCA', destinationAddressLatitude: 33.461929, destinationAddressLongitude: -7.775382 },
    { destinationAddress: 'Carrefour Market Dar Bouazza', destinationDistrict: 'CASABLANCA', destinationAddressLatitude: 33.514029, destinationAddressLongitude: -7.834682 },
  ]

  // Delete existing data to avoid duplicates
  await prisma.storeContact.deleteMany({
    where: { store: { warehouseId: wh.id } }
  })
  await prisma.store.deleteMany({ where: { warehouseId: wh.id } })

  const storeMap: Record<string, string> = {}
  for (const s of storesData) {
    const store = await prisma.store.create({
      data: { ...s, warehouseId: wh.id },
    })
    storeMap[s.destinationAddress] = store.id
  }

  const contacts = [
    { store: 'Carrefour Market Bourgogne', firstname: 'Yassine', lastname: 'Alami', email: 'yassine.alami@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Ain Sebaa', firstname: 'Amine', lastname: 'Bennani', email: 'amine.bennani@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Maarif', firstname: 'Reda', lastname: 'Tahiri', email: 'reda.tahiri@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Panoramique', firstname: 'Anas', lastname: 'Filali', email: 'anas.filali@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Bouskoura Ville', firstname: 'Marwane', lastname: 'El Fassi', email: 'marwane.elfassi@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Dar Bouazza', firstname: 'Ines', lastname: 'Chraibi', email: 'ines.chraibi@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Maarif', firstname: 'Kenza', lastname: 'Idrissi', email: 'kenza.idrissi@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Panoramique', firstname: 'Lina', lastname: 'Amrani', email: 'lina.amrani@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Bouskoura Ville', firstname: 'Nour', lastname: 'Mansouri', email: 'nour.mansouri@gmail.com', mobile: '212668067044' },
    { store: 'Carrefour Market Dar Bouazza', firstname: 'Sanae', lastname: 'Tazi', email: 'sanae.tazi@gmail.com', mobile: '212668067044' },
  ]

  for (const c of contacts) {
    const storeId = storeMap[c.store]
    if (!storeId) continue
    await prisma.storeContact.create({
      data: {
        storeId,
        destinationFirstname: c.firstname,
        destinationLastname: c.lastname,
        destinationEmailAddress: c.email,
        destinationMobileNumber: c.mobile,
      },
    })
  }

  console.log('Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
