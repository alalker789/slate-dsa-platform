import { Algorithm } from "../models/Algorithm.js";
import { cached } from "../services/cache.js";
import { awardXp } from "../services/rewards.js";
import { ApiError } from "../utils/ApiError.js";

const EXPLORE_XP = 20;
const toObj = (a) => ({ ...a, code: a.code instanceof Map ? Object.fromEntries(a.code) : a.code });

// Catalog is read-mostly and identical for everybody, so it is cached for 5 minutes.
export async function listAlgorithms(req, res) {
  const list = await cached("algorithms:list", 300, async () =>
    (await Algorithm.find().select("slug category kind name summary order").sort({ order: 1 }).lean()),
  );
  res.set("Cache-Control", "public, max-age=60");
  res.json({ algorithms: list });
}

export async function getAlgorithm(req, res) {
  const { slug } = req.params;
  const algo = await cached(`algorithms:${slug}`, 300, async () => {
    const doc = await Algorithm.findOne({ slug }).lean();
    return doc ? toObj(doc) : null;
  });
  if (!algo) throw ApiError.notFound("Unknown algorithm");
  res.set("Cache-Control", "public, max-age=60");
  res.json({ algorithm: algo });
}

// First time a learner watches an algorithm to the end they earn XP.
// Marking it explored and granting XP happen in one atomic update, so retries and double-clicks are safe.
export async function completeAlgorithm(req, res) {
  const { slug } = req.params;
  if (!(await Algorithm.exists({ slug }))) throw ApiError.notFound("Unknown algorithm");
  const reward = await awardXp(req.userId, EXPLORE_XP, {
    filter: { explored: { $ne: slug } },
    update: { $addToSet: { explored: slug } },
  });
  res.json(reward ? { firstTime: true, ...reward } : { firstTime: false, gained: 0 });
}
