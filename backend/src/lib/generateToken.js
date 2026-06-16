import jwt from "jsonwebtoken"

export const generateToken = async (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 day expiry
      httpOnly: true, // prevent XSS attacks 
      sameSite: "strict", // prevent CSRF attacks 
    });

    return token;
  } catch (error) {
    return res
      .status(500)
      .json({ message: " unable to generate token" });
  }
};
