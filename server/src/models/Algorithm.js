import mongoose from "mongoose";

const algorithmSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true }, // sorting | searching | tree | graph
  kind: { type: String, enum: ["array", "tree", "graph"], required: true }, // which visualizer renders it
  name: { type: String, required: true },
  summary: String,
  order: { type: Number, default: 0 },
  complexity: [{ _id: false, k: String, v: String }],
  code: { type: Map, of: [String] }, // language -> lines (pseudo, c, cpp, java)
});

export const Algorithm = mongoose.model("Algorithm", algorithmSchema);
