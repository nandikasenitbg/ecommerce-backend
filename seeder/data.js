const bcrypt = require('bcryptjs');

const users = [
  {
    name: 'Admin User',
    email: 'admin@ecommerce.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
  },
  {
    name: 'John Smith',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
  },
];

const products = [
  {
    name: 'Apple AirPods Pro (2nd Generation)',
    description:
      'Active Noise Cancellation with Adaptive Transparency, Personalized Spatial Audio with dynamic head tracking, H2 chip, MagSafe charging case. Up to 6 hours of listening time with ANC enabled.',
    price: 249.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800', alt: 'AirPods Pro' },
    ],
    category: 'Electronics',
    brand: 'Apple',
    countInStock: 45,
    isFeatured: true,
    discount: 0,
    rating: 4.7,
    numReviews: 3,
  },
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    description:
      'Industry-leading noise canceling with two processors and eight microphones. 30-hour battery life with quick charging. Multipoint connection. Speak-to-Chat technology.',
    price: 349.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', alt: 'Sony Headphones' },
    ],
    category: 'Electronics',
    brand: 'Sony',
    countInStock: 30,
    isFeatured: true,
    discount: 10,
    rating: 4.8,
    numReviews: 2,
  },
  {
    name: 'Samsung 65" QLED 4K Smart TV',
    description:
      'Quantum Dot technology delivers 100% Color Volume. Quantum HDR. Neo Quantum Processor 4K. Object Tracking Sound+. Anti-Reflection Panel. Motion Xcelerator Turbo+.',
    price: 1299.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800', alt: 'Samsung TV' },
    ],
    category: 'Electronics',
    brand: 'Samsung',
    countInStock: 15,
    isFeatured: true,
    discount: 5,
    rating: 4.5,
    numReviews: 2,
  },
  {
    name: 'Nike Air Max 270 Running Shoes',
    description:
      "Nike's first lifestyle Air Max shoe features the largest heel Air unit yet for an incredibly light, comfortable ride. The mesh upper and Phylon foam midsole keep it lightweight and breathable.",
    price: 150.0,
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', alt: 'Nike Air Max 270' },
    ],
    category: 'Clothing',
    brand: 'Nike',
    countInStock: 60,
    isFeatured: true,
    discount: 0,
    rating: 4.4,
    numReviews: 2,
  },
  {
    name: 'The Pragmatic Programmer: 20th Anniversary Edition',
    description:
      'The classic book updated for the modern developer. Covers topics from personal responsibility to career development to architectural techniques for keeping your code flexible.',
    price: 49.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', alt: 'Programming Book' },
    ],
    category: 'Books',
    brand: 'Addison-Wesley',
    countInStock: 100,
    isFeatured: false,
    discount: 0,
    rating: 4.9,
    numReviews: 2,
  },
  {
    name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
    description:
      '7-in-1 multi-use programmable cooker: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer. 6 quart capacity. 13 smart programs.',
    price: 89.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800', alt: 'Instant Pot' },
    ],
    category: 'Home & Garden',
    brand: 'Instant Pot',
    countInStock: 75,
    isFeatured: false,
    discount: 15,
    rating: 4.6,
    numReviews: 2,
  },
  {
    name: 'Lululemon Align High-Rise Yoga Pants',
    description:
      "Made with our buttery-soft Nulu™ fabric, these yoga pants move with you. Lightweight and sweat-wicking with a secure waistband and hidden pocket. 28\" inseam.",
    price: 128.0,
    images: [
      { url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800', alt: 'Yoga Pants' },
    ],
    category: 'Sports',
    brand: 'Lululemon',
    countInStock: 40,
    isFeatured: false,
    discount: 0,
    rating: 4.5,
    numReviews: 1,
  },
  {
    name: 'MacBook Pro 14-inch M3 Pro',
    description:
      'Apple M3 Pro chip with 11-core CPU, 14-core GPU, 16-core Neural Engine. 18GB unified memory. 512GB SSD storage. 14.2-inch Liquid Retina XDR display. 22-hour battery life.',
    price: 1999.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', alt: 'MacBook Pro' },
    ],
    category: 'Electronics',
    brand: 'Apple',
    countInStock: 20,
    isFeatured: true,
    discount: 0,
    rating: 4.9,
    numReviews: 2,
  },
  {
    name: 'Dyson V15 Detect Absolute Cordless Vacuum',
    description:
      'Laser reveals microscopic dust. Acoustic piezo sensor counts and sizes dust particles. Up to 60 minutes of run time. HEPA filtration captures 99.97% of particles.',
    price: 749.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', alt: 'Dyson Vacuum' },
    ],
    category: 'Home & Garden',
    brand: 'Dyson',
    countInStock: 25,
    isFeatured: false,
    discount: 8,
    rating: 4.7,
    numReviews: 2,
  },
  {
    name: 'Adidas Ultraboost 23 Running Shoes',
    description:
      'BOOST midsole technology for incredible energy return. Continental Rubber outsole for excellent grip. Primeknit+ upper adapts to your foot movement. 4D heel frame for stability.',
    price: 190.0,
    images: [
      { url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800', alt: 'Adidas Ultraboost' },
    ],
    category: 'Sports',
    brand: 'Adidas',
    countInStock: 50,
    isFeatured: true,
    discount: 0,
    rating: 4.3,
    numReviews: 2,
  },
  {
    name: 'LEGO Star Wars Millennium Falcon (75257)',
    description:
      'Build and display the iconic LEGO Star Wars Millennium Falcon! Features include rotating top and bottom laser turrets, cockpit that opens, and removable hull panels.',
    price: 159.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800', alt: 'LEGO Falcon' },
    ],
    category: 'Toys',
    brand: 'LEGO',
    countInStock: 35,
    isFeatured: false,
    discount: 0,
    rating: 4.8,
    numReviews: 2,
  },
  {
    name: 'Kindle Paperwhite (11th Generation)',
    description:
      'Now with a 6.8" display and thinner borders, adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns. IPX8 waterproof rating.',
    price: 139.99,
    images: [
      { url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800', alt: 'Kindle Paperwhite' },
    ],
    category: 'Electronics',
    brand: 'Amazon',
    countInStock: 80,
    isFeatured: false,
    discount: 0,
    rating: 4.6,
    numReviews: 2,
  },
];

module.exports = { users, products };
