import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../services/token.js";
import { ApiError } from "../utils/ApiError.js";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
});

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict("That email is already registered");
  // cost 10 keeps login ~60-100ms of CPU; raise it if your hardware allows
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");
  // same message for unknown email and bad password: don't leak which accounts exist
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw ApiError.unauthorized("Invalid email or password");
  res.json({ token: signToken(user._id), user: publicUser(user) });
}

export async function me(req, res) {
  const user = await User.findById(req.userId).lean();
  if (!user) throw ApiError.unauthorized();
  res.json({ user: publicUser(user) });
}
