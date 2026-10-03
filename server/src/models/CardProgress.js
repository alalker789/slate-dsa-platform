import mongoose from "mongoose";

// One document per (user, card): the SM-2 scheduling state.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  ef: { type: Number, default: 2.5 },
  reps: { type: Number, default: 0 },
  interval: { type: Number, default: 0 }, // days
  lapses: { type: Number, default: 0 },
  due: { type: Date, required: true },
  lastReviewedAt: Date,
});

schema.index({ user: 1, card: 1 }, { unique: true });
schema.index({ user: 1, due: 1 }); // "what is due for me?" is the hottest query in the app

export const CardProgress = mongoose.model("CardProgress", schema);
