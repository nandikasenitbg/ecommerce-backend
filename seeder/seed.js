/**
 * Database Seeder
 * Usage:
 *   node seeder/seed.js           → Import seed data
 *   node seeder/seed.js --destroy → Wipe all data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { users, products } = require('./data');

connectDB();

// ─── Import Data ──────────────────────────────────────────────────────────────
const importData = async () => {
  try {
    console.log('Clearing existing data...'.yellow);

    // Clear all collections
    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Seeding users...'.cyan);

    // Hash passwords before inserting (bypasses mongoose middleware for bulk insert)
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12),
      }))
    );

    const createdUsers = await User.insertMany(hashedUsers);
    const adminUser = createdUsers[0]; // First user is admin

    console.log(`✓ ${createdUsers.length} users created`.green);

    console.log('Seeding products...'.cyan);

    // Attach admin user to all products
    const sampleProducts = products.map((product) => ({
      ...product,
      user: adminUser._id,
    }));

    const createdProducts = await Product.insertMany(sampleProducts);

    console.log(`✓ ${createdProducts.length} products created`.green);

    console.log('\n================================================'.rainbow);
    console.log('  DATABASE SEEDED SUCCESSFULLY!  '.green.bold);
    console.log('================================================'.rainbow);
    console.log('\n Admin credentials:'.cyan);
    console.log(`  Email   : admin@ecommerce.com`.white);
    console.log(`  Password: admin123`.white);
    console.log('\n User credentials:'.cyan);
    console.log(`  Email   : jane@example.com`.white);
    console.log(`  Password: password123`.white);
    console.log('\n API Base URL:'.cyan);
    console.log(`  http://localhost:${process.env.PORT || 5000}/api`.white);
    console.log('================================================\n'.rainbow);

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`.red.bold);
    process.exit(1);
  }
};

// ─── Destroy Data ─────────────────────────────────────────────────────────────
const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('\n================================================'.rainbow);
    console.log('  ALL DATA DESTROYED SUCCESSFULLY!  '.red.bold);
    console.log('================================================\n'.rainbow);

    process.exit(0);
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`.red.bold);
    process.exit(1);
  }
};

// ─── Run based on CLI flag ────────────────────────────────────────────────────
if (process.argv[2] === '--destroy') {
  destroyData();
} else {
  importData();
}
