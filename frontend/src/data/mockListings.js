export const CATEGORIES = [
  { key: 'apartments', label: 'Apartments' },
  { key: 'houses', label: 'Houses' },
  { key: 'villas', label: 'Villas' },
  { key: 'studios', label: 'Studios' },
  { key: 'lofts', label: 'Lofts' },
]

const u = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`

export const MOCK_LISTINGS = [
  {
    id: 'l1',
    title: 'Sunny apartment near downtown',
    address: 'Almaty, Medeu District',
    price: 18000,
    priceUnit: 'night',
    category: 'apartments',
    rooms: 2,
    floor: 5,
    badges: ['Top Host'],
    isNew: true,
    hasPhotos: true,
    host: { name: 'Aida', avatarUrl: u('photo-1520975661595-6453be3f7070') },
    amenities: ['Wi‑Fi', 'Parking', 'AC', 'Kitchen'],
    photos: [
      u('photo-1522708323590-d24dbb6b0267'),
      u('photo-1505693416388-ac5ce068fe85'),
      u('photo-1502005229762-cf1b2da7c5d6'),
      u('photo-1502672260266-1c1ef2d93688'),
      u('photo-1484154218962-a197022b5858'),
    ],
    location: { lat: 43.238949, lng: 76.889709 },
  },
  {
    id: 'l2',
    title: 'Modern house with a garden',
    address: 'Astana, Yesil District',
    price: 42000,
    priceUnit: 'night',
    category: 'houses',
    rooms: 4,
    floor: 1,
    badges: [],
    isNew: false,
    hasPhotos: true,
    host: { name: 'Timur', avatarUrl: u('photo-1500648767791-00dcc994a43e') },
    amenities: ['Wi‑Fi', 'Parking', 'Washer', 'Heating'],
    photos: [
      u('photo-1568605114967-8130f3a36994'),
      u('photo-1580587771525-78b9dba3b914'),
      u('photo-1560448204-e02f11c3d0e2'),
      u('photo-1501183638710-841dd1904471'),
      u('photo-1523217582562-09d0def993a6'),
    ],
    location: { lat: 51.160523, lng: 71.470356 },
  },
  {
    id: 'l3',
    title: 'Cozy studio with city views',
    address: 'Shymkent, Abay District',
    price: 12000,
    priceUnit: 'night',
    category: 'studios',
    rooms: 1,
    floor: 12,
    badges: ['New'],
    isNew: true,
    hasPhotos: true,
    host: { name: 'Dana', avatarUrl: u('photo-1544005313-94ddf0286df2') },
    amenities: ['Wi‑Fi', 'AC', 'Elevator'],
    photos: [
      u('photo-1493809842364-78817add7ffb'),
      u('photo-1512918728675-ed5a9ecdebfd'),
      u('photo-1513694203232-719a280e022f'),
      u('photo-1502672023488-70e25813eb80'),
      u('photo-1549187774-b4e9b0445b41'),
    ],
    location: { lat: 42.341686, lng: 69.590101 },
  },
]

export function formatPriceKZT(value) {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(value)
}

