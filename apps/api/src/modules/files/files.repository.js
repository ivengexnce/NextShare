const File = require('./files.schema');

const FilesRepository = {
  async create(data) {
    return File.create(data);
  },

  async findByCode(shortCode) {
    return File.findOne({ shortCode, isActive: true });
  },

  async findByCodeWithPassword(shortCode) {
    // Select password only when explicitly verifying
    return File.findOne({ shortCode, isActive: true }).select('+password');
  },

  async incrementDownloads(shortCode) {
    return File.updateOne({ shortCode }, { $inc: { downloadCount: 1 } });
  },

  async deactivate(shortCode) {
    return File.updateOne({ shortCode }, { isActive: false });
  },

  async listByUploader(uploadedBy, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      File.find({ uploadedBy, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      File.countDocuments({ uploadedBy, isActive: true }),
    ]);
    return { items, total, page, limit };
  },
};

module.exports = FilesRepository;
