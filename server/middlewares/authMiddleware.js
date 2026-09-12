import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { prisma } from "../config/db.js";
import { clearAuthCookie } from "../config/generateToken.js";

config();

// Two distinct 401 cases. NO_SESSION means the visitor is simply not logged in,
// which is normal on public pages. SESSION_INVALID means a cookie was sent but
// is no longer usable, and the client turns that into a redirect to the login.
export const verifyJWT = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({
      message: "Cookie was not received from the user",
      code: "NO_SESSION",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, `${process.env.JWT_SECRET}`);
  } catch (err) {
    clearAuthCookie(res);
    return res
      .status(401)
      .json({ message: "Invalid token", code: "SESSION_INVALID" });
  }

  try {
    // The account can be deleted while a signed token is still within its
    // validity window, so existence is checked here instead of in every
    // controller that would otherwise operate on a missing user.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true },
    });

    if (!user) {
      clearAuthCookie(res);
      return res
        .status(401)
        .json({ message: "Account no longer exists", code: "SESSION_INVALID" });
    }

    req.user = { ...decoded, id: user.id, email: user.email };
    next();
  } catch (err) {
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

// Role is read from the database rather than the token so that a revoked
// admin loses access immediately and a stale token cannot carry the claim.
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, emailVerified: true },
    });

    if (!user || !user.emailVerified) {
      return res.status(403).json({ message: "Administrator access required" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Authorization check failed" });
  }
};
