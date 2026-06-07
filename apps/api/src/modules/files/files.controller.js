const FilesService = require('./files.service');
const ResponseFactory = require('../../shared/utils/response.factory');

const FilesController = {
  /** POST /api/files/upload */
  async upload(req, res) {
    const uploadedBy = req.ip || 'anonymous';
    const result = await FilesService.registerUpload(req.file, req.body, uploadedBy);
    return ResponseFactory.success(res, result, 'File uploaded successfully', 201);
  },

  /** GET /api/files/:code/download — streams the file to the client */
  async download(req, res) {
    const { code } = req.params;
    const { filePath, originalName, mimeType, size } = await FilesService.resolveDownload(code);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader('Cache-Control', 'no-store');

    // Use res.sendFile for efficient kernel-level transfer
    return res.sendFile(filePath, { dotfiles: 'deny' });
  },

  /** GET /api/files/:code — metadata only, no file content */
  async meta(req, res) {
    const { code } = req.params;
    const result = await FilesService.getMeta(code);
    return ResponseFactory.success(res, result, 'File metadata retrieved');
  },

  /** DELETE /api/files/:code */
  async remove(req, res) {
    const { code } = req.params;
    const requestedBy = req.ip || 'anonymous';
    await FilesService.deleteFile(code, requestedBy);
    return ResponseFactory.success(res, null, 'File deleted');
  },
};

module.exports = FilesController;
