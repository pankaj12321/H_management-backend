const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected', process.env.MONGO_URI);

    // Drop unique indexes on Password and UserName if they exist
    const connection = mongoose.connection;
    try {
      await connection.db.collection('managers').dropIndex('Password_1');
      console.log('🗑️ Dropped unique index: Password_1');
    } catch (e) {
      // Index might not exist, which is fine
    }
    try {
      await connection.db.collection('managers').dropIndex('UserName_1');
      console.log('🗑️ Dropped unique index: UserName_1');
    } catch (e) {
      // Index might not exist, which is fine
    }

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1); // stop server if DB fails
  }
};

module.exports = connectDB;
