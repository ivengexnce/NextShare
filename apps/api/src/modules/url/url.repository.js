const Url = require('./url.schema');

/**
 * UrlRepository — all Mongoose calls live here.
 *
 * Layer rule: repositories never contain business logic.
 *             Business logic lives in url.service.js.
 */
const UrlRepository = {
  async findByCode(shortCode) {
    return Url.findOne({ shortCode, isActive: true });
  },

  async findById(id) {
    return Url.findById(id);
  },

  async create(data) {
    return Url.create(data);
  },

  async incrementClicks(shortCode) {
    // Non-blocking fire-and-forget — wrap date push to cap log at 1000 entries
    return Url.updateOne(
      { shortCode },
      {
        $inc: { clicks: 1 },
        $push: {
          clickLog: {
            $each: [new Date()],
            $slice: -1000,   // keep last 1000 timestamps
          },
        },
      },
    );
  },

  async deactivate(shortCode) {
    return Url.updateOne({ shortCode }, { isActive: false });
  },

  async listByCreator(createdBy, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Url.find({ createdBy, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Url.countDocuments({ createdBy, isActive: true }),
    ]);
    return { items, total, page, limit };
  },

  async codeExists(shortCode) {
    const doc = await Url.exists({ shortCode });
    return !!doc;
  },
};

module.exports = UrlRepository;
