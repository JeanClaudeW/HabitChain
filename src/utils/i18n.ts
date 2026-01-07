// Helper to sanitize display strings into translation keys
export const tKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
