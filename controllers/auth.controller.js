import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";

// SIGNUP CONTROLLER
export const signup = async (req, res) => {
	try {
		const { first_name, last_name, email, username, password, confirmPassword, gender } = req.body;

		// Check if email already exists
		const userAlreadyExists = await User.findOne({ email });
		// console.log("user already exists", userAlreadyExists);
		if (userAlreadyExists) {
			return res.status(400).json({ error: "Email already exists" });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		const user = await User.findOne({ username });
		if (user) {
			return res.status(400).json({ error: "Username already exists" });
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
			await newUser.save();

			res.status(201).json({
				message: "User created successfully",
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
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// LOGIN CONTROLLER
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid email or password" });
		}

		if (!user.isVerified) {
			return res.status(400).json({ error: "Please verify your email" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			username: user.username,
			profilePic: user.profilePic,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
