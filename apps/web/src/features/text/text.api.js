const BASE = '/api/pastes';

export const textApi = {
    async create(payload) {
        const res = await fetch(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    get: async(code) => {
        const res = await fetch(`${BASE}/${code}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },

    async getPresets() {
        const res = await fetch(`${BASE}/meta/presets`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },
};