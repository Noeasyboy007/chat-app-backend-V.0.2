import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Create a test function to check if credentials are loaded
// const checkCredentials = () => {
//     console.log('Checking email credentials:');
//     console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Present' : 'Missing');
//     console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Present' : 'Missing');
// };

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test the connection and log detailed information
transporter.verify(function(error, success) {
    // checkCredentials(); // Log credential status
    if (error) {
        console.log('Error with email configuration:', error);
        console.log('Current auth config:', {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS ? '****' : 'missing'
        });
    } else {
        console.log('Server is ready to take messages');
    }
});

export const emailConfig = {
    from: {
        name: "Chat App",
        address: process.env.EMAIL_FROM
    }
};

export default transporter; 