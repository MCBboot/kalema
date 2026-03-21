import "dotenv/config";

export const PORT = parseInt(process.env.PORT || "26033", 10);
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:26032";
export const NODE_ENV = process.env.NODE_ENV || "development";
