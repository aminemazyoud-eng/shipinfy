export interface Tournee {
  shipperReference?: string
  destinationFirstname: string
  destinationLastname: string
  destinationEmailAddress: string
  destinationMobileNumber: string
  destinationAddress: string
  destinationDistrict: string
  destinationAddressLatitude: number
  destinationAddressLongitude: number
  deliveryTimeStart?: string
  deliveryTimeEnd?: string
  shippingFees?: string
  paymentOnDeliveryAmount?: string
  contentDescription?: string
  externalReference?: string
}

export function generateCSV(tournees: Tournee[]): string {
  const headers = [
    'shipperReference', 'shipperCode', 'partyLogisticsCode', 'originHubCode',
    'destinationFirstname', 'destinationLastname', 'destinationEmailAddress',
    'destinationMobileNumber', 'destinationAddress', 'destinationDistrict',
    'destinationAddressLatitude', 'destinationAddressLongitude',
    'deliveryTimeStart', 'deliveryTimeEnd', 'shippingFees',
    'paymentOnDeliveryAmount', 'contentDescription', 'externalReference',
    'shippingStrategy', 'paymentStrategy'
  ]

  const rows = tournees.map(t => [
    t.shipperReference ?? '',
    'FMCG',
    'TRANSPORT EXPRESS',
    'WAREHOUSE CENTRAL',
    t.destinationFirstname,
    t.destinationLastname,
    t.destinationEmailAddress,
    t.destinationMobileNumber,
    t.destinationAddress,
    t.destinationDistrict,
    t.destinationAddressLatitude,
    t.destinationAddressLongitude,
    t.deliveryTimeStart ?? '',
    t.deliveryTimeEnd ?? '',
    t.shippingFees ?? '',
    t.paymentOnDeliveryAmount ?? '',
    t.contentDescription ?? '',
    t.externalReference ?? '',
    'EXPRESS_SHIPPING_GROCERY_SHIPINFY_COMMUNITY',
    'CASH_ON_DELIVERY_SHIPINFY_COMMUNITY'
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
