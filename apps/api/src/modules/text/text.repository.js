const { Paste } = require('./text.schema');

const TextRepository = {
  async create(data) {
    return Paste.create(data);
  },

  async findByCode(shortCode) {
    return Paste.findOne({ shortCode, isActive: true });
  },

  async incrementViews(shortCode) {
    return Paste.updateOne({ shortCode }, { $inc: { viewCount: 1 } });
  },

  async deactivate(shortCode) {
    return Paste.updateOne({ shortCode }, { isActive: false });
  },

  /** Hard delete for burn-after-read pastes */
  async destroy(shortCode) {
    return Paste.deleteOne({ shortCode });
  },
};

module.exports = TextRepository;
