import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const jwtToken = `${process.env.JWT_SECRET}`;
const jwtExpires = `${process.env.JWT_EXPIRES_IN}`;

// Kept in one place so the cookie is cleared with the same attributes it was
// set with. A mismatch leaves the browser holding a cookie that never expires.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

export const generateToken = (user, res) => {
  const token = jwt.sign({ id: user.id, email: user.email }, jwtToken, {
    expiresIn: jwtExpires,
  });

  res.cookie("jwt", token, {
    ...COOKIE_OPTIONS,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  console.log("Cookie was generated");
  return token;
};

export const clearAuthCookie = (res) => {
  res.clearCookie("jwt", COOKIE_OPTIONS);
};
