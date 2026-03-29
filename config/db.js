const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are defaults in Mongoose 8+, kept here for clarity
    });

    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.bold);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
