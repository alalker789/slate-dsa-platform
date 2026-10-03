import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    xp: { type: Number, default: 0, index: -1 }, // leaderboard sort key
    streak: {
      count: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastDay: { type: String, default: null }, // "YYYY-MM-DD" (UTC)
    },
    explored: { type: [String], default: [] }, // algorithm slugs the user has watched to the end
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
