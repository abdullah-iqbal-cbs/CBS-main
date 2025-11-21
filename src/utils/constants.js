export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_NUMBER = 1;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const ACTIVATE_SECRET = process.env.ACTIVATION_SECRET || "ACTIVATION_SECRET_KEY";