import path from "path";

export const cwd = process.cwd();

export const srcPath = path.join(cwd, "./src");
export const appTSPath = path.join(cwd, "./src/App.ts");

export const buildPath = path.join(cwd, "./build");
export const handlerJSPath = path.join(cwd, "./build/handler.js");
export const handlerTSPath = path.join(cwd, "./build/handler.ts");
export const handlerZipPath = path.join(cwd, "./build/handler.zip");
export const eventSchemaPath = path.join(cwd, "./build/event-schema.json");
export const appJSPath = path.join(cwd, "./build/App.js");

export const clientPublicPath = path.join(cwd, "./decltr/client");
