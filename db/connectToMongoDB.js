import mongoose from 'mongoose';
import colors from 'colors';

const connectToMongoDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URL)
		console.log(`Connected to MongoDB ${process.env.MONGODB_URL}`.bgGreen.white);
	}
	catch (error) {
		console.log(`Error connecting to MongoDB ${error.message}`.bgRed.white);
	}
}

export default connectToMongoDB;