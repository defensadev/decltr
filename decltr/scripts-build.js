var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var import_esbuild = require("esbuild");
var import_path = __toESM(require("path"));
var import_node_resolve = __toESM(require("@esbuild-plugins/node-resolve"));
const scriptsBuild = async () => {
  const cwd = process.cwd();
  const entryPoints = ["start.ts", "build.ts"].map((p) => import_path.default.join(cwd, "./decltr/scripts/src", p));
  const outdir = import_path.default.join(cwd, "./decltr/scripts/dist");
  const result = await (0, import_esbuild.build)({
    bundle: true,
    entryPoints,
    legalComments: "linked",
    outdir,
    platform: "node",
    plugins: [
      (0, import_node_resolve.default)({
        extensions: [".ts", ".js"],
        onResolved: (resolved) => {
          if (resolved.includes("chalk")) {
            return resolved;
          }
          if (resolved.includes("node_modules") || resolved.startsWith("node:")) {
            return {
              external: true
            };
          }
          return resolved;
        }
      })
    ],
    target: "node14",
    treeShaking: true,
    write: true,
    metafile: true
  });
  const res = await (0, import_esbuild.analyzeMetafile)(result.metafile, { color: true });
  console.log(res);
};
scriptsBuild();
