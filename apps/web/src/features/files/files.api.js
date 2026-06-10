const BASE = `${import.meta.env.VITE_API_URL || ''}/api/files`;


export const filesApi = {
    /**
     * Upload a file with progress tracking.
     * Uses XMLHttpRequest so we get upload progress events.
     */
    upload(file, options = {}, onProgress) {
        return new Promise((resolve, reject) => {
            const form = new FormData();
            form.append('file', file);
            if (options.expiresIn) form.append('expiresIn', options.expiresIn);
            if (options.maxDownloads) form.append('maxDownloads', options.maxDownloads);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${BASE}/upload`);

            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
                });
            }

            xhr.onload = () => {
                const data = JSON.parse(xhr.responseText);
                if (data.success) resolve(data.data);
                else reject(new Error(data.message));
            };
            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(form);
        });
    },

    async getMeta(code) {
        const res = await fetch(`${BASE}/${code}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    getDownloadUrl(code) {
        return `${BASE}/${code}/download`;
    },

    async remove(code) {
        const res = await fetch(`${BASE}/${code}`, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },
};