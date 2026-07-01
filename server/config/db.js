import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Ensure your IP address is whitelisted in MongoDB Atlas and the MONGO_URI in server/.env is correct.');
    process.exit(1);
  }
};

export default connectDB;
