import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import colors from "colors";
import cors from "cors"; // Import cors

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
// app.use(cors());
// Improved CORS configuration
app.use(cors({
	// Allow requests from your Vercel domain or any origin during development
	origin: process.env.FRONTEND_URL || "*",
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(cookieParser());

// API Routes - these should come BEFORE the static file serving
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Add a test route for CORS checking
app.get("/api/test-cors", (req, res) => {
	res.json({ 
		success: true, 
		message: "CORS is working!",
		timestamp: new Date().toISOString()
	});
});

// Health check route
app.get("/api/health", (req, res) => {
	res.json({ message: "Chat API is running" });
});

server.listen(PORT, () => {
	connectToMongoDB();
	console.log(`Server Running on port ${PORT}`.bgBlue.white);
});
