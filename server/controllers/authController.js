import { prisma } from "../config/db.js";
import bcrypt, { compare } from "bcrypt";
import crypto from "crypto";
import { config } from "dotenv";
import { generateToken, clearAuthCookie } from "../config/generateToken.js";
import { resend } from "../config/resendSDK.js";

config();

// A trailing slash in the env value would produce links like host//api/...,
// which Express treats as a different path and answers with 404.
const trimSlash = (url) => url.replace(/\/+$/, "");

// Defaults target the local dev servers. The deployment platforms set these
// names in their own environment, which takes priority.
const APP_URL = trimSlash(process.env.VERCEL_URL || "http://localhost:5173");
const API_URL = trimSlash(process.env.RENDER_URL || "http://localhost:4996");

export const getUser = async (req, res) => {
  try {
    // Only the fields the profile screen renders. The password hash and the
    // email verification token must never reach the browser.
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Account no longer exists", code: "SESSION_INVALID" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load user" });
  }
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    const userExist = await prisma.user.findUnique({
      where: { email: email },
    });

    if (userExist) {
      return res
        .status(400)
        .json({ message: "User with the same email was already registered" });
    }

    //password hashing
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords don't match, please enter the equal passwords",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Single-use, unguessable, 24h token. The previous link carried only the
    // sequential user id, so any account could be verified by guessing it.
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const createUser = await prisma.user.create({
      data: {
        fullName: fullName ?? "",
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires,
      },
    });

    const verifyUrl = `${API_URL}/api/user/verify-email?token=${verificationToken}`;

    // Delivery failure must not roll back a created account. On the Resend
    // sandbox sender only the account owner's address is deliverable, so a
    // verified domain is required before arbitrary users can register.
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Verify your email",
        html: `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #eee; border-radius: 8px;">
    <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Verify your email</h2>
    <p style="color: #555; font-size: 15px; margin-bottom: 24px;">Thanks for signing up! Click the button below to verify your email address and activate your account.</p>
    <a href="${verifyUrl}"
       style="display: inline-block; background: #000; color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 32px; border-radius: 4px;">
      Verify Email
    </a>
    <p style="color: #aaa; font-size: 12px; margin-top: 24px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
  </div>
`,
      });
    } catch (mailErr) {
      console.error("Verification email could not be sent:", mailErr.message);
    }

    const createCart = await prisma.cart.create({
      data: {
        userId: createUser.id,
      },
    });

    const createWishlist = await prisma.wishlist.create({
      data: {
        userId: createUser.id,
      },
    });

    const {
      password: _password,
      verificationToken: _token,
      verificationTokenExpires: _expires,
      ...safeUser
    } = createUser;

    // No session is issued here. The account is inactive until the emailed
    // link is used, and the user then signs in through /login.
    return res.status(201).json({
      user: safeUser,
      message:
        "Registration successful. Check your email to verify the account.",
    });
  } catch (err) {
    console.log("Server Error: ", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(`${APP_URL}/login?verified=invalid`);
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user || !user.verificationTokenExpires) {
      return res.redirect(`${APP_URL}/login?verified=invalid`);
    }

    if (user.verificationTokenExpires < new Date()) {
      return res.redirect(`${APP_URL}/login?verified=expired`);
    }

    // The token is cleared so the link cannot be replayed.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return res.redirect(`${APP_URL}/login?verified=true`);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "User was not verified", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExist = await prisma.user.findUnique({ where: { email: email } });

    if (!userExist) {
      return res.status(400).json({ message: "User was not found" });
    }

    if (!userExist.emailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    const passwordsEqual = await compare(password, userExist.password);

    if (!passwordsEqual) {
      console.log("Incorrect password");
      return res.status(400).json({ message: "Incorrect password" });
    }

    const { password: _password, ...userWithoutPassword } = userExist;
    return res.status(201).json({
      user: userWithoutPassword,
      token: generateToken(userExist, res),
    });
  } catch (err) {
    console.log("Server error while login: ", err);
    res.status(500).json({ message: err });
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);

  return res.status(201).json({
    message: "User was successfully logged out",
  });
};

export const changeUserData = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
      },
    });

    if (!user) return res.status(400).json({ message: "User was not found" });

    const updateData = { fullName, email };

    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords don't match" });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: updateData,
    });

    return res.status(200).json({ message: "Profile updated" });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
};
