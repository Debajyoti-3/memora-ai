import jwt from "jsonwebtoken"

export const generateToken = async (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 day expiry
      httpOnly: true, // prevent XSS attacks 
      sameSite: isProduction ? "none" : "lax", 
      secure: isProduction,
    });

    return token;
  } catch (error) {
    return res
      .status(500)
      .json({ message: " unable to generate token" });
  }
};
