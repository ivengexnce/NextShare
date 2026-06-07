const BASE = '/api/urls';

export const urlApi = {
  async shorten(payload) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getStats(code) {
    const res = await fetch(`${BASE}/${code}/stats`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
