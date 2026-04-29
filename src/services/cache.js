const store = {};

export const getCache = (key) => store[key] || null;

export const setCache = (key, data) => { store[key] = data; };

export const clearCache = (key) => { delete store[key]; };
