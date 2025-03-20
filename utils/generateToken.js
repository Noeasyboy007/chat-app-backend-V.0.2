import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.SECRET_KEY, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000, // MS
		httpOnly: true, // prevent XSS attacks cross-site scripting attacks
		sameSite: "none", // Changed from "strict" to "none" to allow cross-site cookies
		secure: true, // Must be true when sameSite is "none"
		path: "/", // Ensure cookie is sent with all requests
	});
};

