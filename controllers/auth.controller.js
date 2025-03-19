import bcrypt from "bcryptjs";
import crypto from 'crypto';
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail, sendPasswordResetSuccessEmail } from '../services/email.service.js';
import dotenv from 'dotenv';
dotenv.config();

// SIGNUP CONTROLLER
export const signup = async (req, res) => {
	try {
		const { first_name, last_name, email, username, password, confirmPassword, gender } = req.body;

		// Check if email already exists
		const userAlreadyExists = await User.findOne({ email });
		// console.log("user already exists", userAlreadyExists);
		if (userAlreadyExists) {
			return res.status(400).json({ success: false, error: "Email already exists" });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ success: false, error: "Passwords don't match" });
		}

		const user = await User.findOne({ username });
		if (user) {
			return res.status(400).json({ success: false, error: "Username already exists" });
		}

		// HASH PASSWORD HERE
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// https://avatar-placeholder.iran.liara.run/

		// const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
		// const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

		const boyProfilePic = `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}`;
		const girlProfilePic = `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}`;

		const verificationToken = generateVerificationToken();

		const newUser = new User({
			first_name: first_name,
			last_name: last_name,
			email,
			username,
			password: hashedPassword,
			gender,
			profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
			verificationToken,
			verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // for 24 Hours
		});

		if (newUser) {
			// Generate JWT token here
			generateTokenAndSetCookie(newUser._id, res);

			// Send verification email
			await sendVerificationEmail(newUser.email, verificationToken);

			await newUser.save();

			res.status(201).json({
				message: "User created successfully. Please check your email for verification.",
				newUser: {
					...newUser._doc,
					password: undefined,
				},
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ success: false, error: "Internal Server Error" });
	}
};

// VERIFY EMAIL CONTROLLER
export const verifyEmail = async (req, res) => {
	// extract the verification code from the body
	// passes the verification code form frontend the recived code in email address and store in database()
	const { code } = req.body;
	try {
		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpiresAt: { $gt: Date.now() },
		})

		// Checke the verification code is correct or expired
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired Verification Code" });
		}

		// update the database
		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiresAt = undefined;

		// save the updated user
		await user.save();

		// Send Welcome email notification to signup user
		await sendWelcomeEmail(user.email, user.name)

		// For response Messege Code
		res.status(200).json({ success: true, message: "Email Verification successful" });
		// console.log("Email Verification successful :- 4");


	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
		console.log("Error: " + error.message);
	}

};

// LOGIN CONTROLLER
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ success: false, error: "Invalid email or password" });
		}

		if (!user.isVerified) {
			return res.status(400).json({ success: false, error: "Please verify your email" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			success: true,
			message: "Login successful",
			_id: user._id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			username: user.username,
			profilePic: user.profilePic,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ success: false, error: "Internal Server Error" });
	}
};

// FORGET PASSWORD CONTROLLER
export const forgotPassword = async (req, res) => {
	// extract the eamil address from the body wich store in database
	const { email } = req.body;

	try {
		// Check if user have accout or valid email address
		const user = await User.findOne({ email });
		if (!user) {
			console.log('User not found');
			return res.status(401).json({ success: false, message: "Email not found" });

		}

		// generate a new reset token
		const resetToken = crypto.randomBytes(20).toString('hex');

		// Token expiration
		const resetTokenExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

		// update the database
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		// save the updated user
		await user.save();

		// Send Reset password link with token in email notification to user
		await sendResetPasswordEmail(user.email, `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`);

		// For response Messege Code
		res.status(200).json({ success: true, message: "Reset Password link sent to your email" });
		// console.log("Reset Password link sent to your email :- 7");

	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
		console.log("Error in forgot password: " + error.message);
	}
};

// RESET PASSWORD CONTROLLER
export const resetPassword = async (req, res) => {
	try {
		const token = req.params.token;
		const { password } = req.body;

		// Log the incoming token for debugging
		// console.log("Received reset token:", token);

		// Find user by token and check expiration
		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() }, // Token must not be expired
		});

		// Log the found user for debugging
		// console.log("Found user with token:", user);

		// Check if user exists and the token is valid
		if (!user) {
			console.log('Invalid or expired reset password token');
			return res.status(401).json({ success: false, message: "Invalid or expired reset password token" });
		}

		// Update and hash the new password
		const hashedPassword = await bcrypt.hash(password, 10);
		user.password = hashedPassword;

		// Clear reset token and expiration time
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;

		// Save updated user to database
		await user.save();

		// Send reset successful email notification
		await sendPasswordResetSuccessEmail(user.email);

		// Response
		// console.log("Reset Password successfully :- 9");
		res.status(200).json({ success: true, message: "Password reset successful" });

	} catch (error) {
		console.log("password reset error", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// LOGOUT CONTROLLER
export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
