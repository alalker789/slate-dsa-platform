import mongoose from "mongoose";

// Append-only history; powers the activity heatmap and retention stats.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  rating: { type: String, enum: ["again", "hard", "good", "easy"], required: true },
  at: { type: Date, default: Date.now },
  day: { type: String, required: true }, // "YYYY-MM-DD" (UTC), written once so heatmap queries are a plain indexed group-by
});

schema.index({ user: 1, day: 1 });

export const ReviewLog = mongoose.model("ReviewLog", schema);
