import "dotenv/config";

export const PORT = parseInt(process.env.PORT || "3001", 10);
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
export const NODE_ENV = process.env.NODE_ENV || "development";
