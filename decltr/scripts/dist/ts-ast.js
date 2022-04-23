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

// decltr/scripts/src/ts-ast.ts
var import_core = require("@swc/core");

// decltr/scripts/src/env.ts
var import_path = __toESM(require("path"));
var cwd = process.cwd();
var appTSPath = import_path.default.join(cwd, "./src/App.ts");
var buildPath = import_path.default.join(cwd, "./build");
var handlerJSPath = import_path.default.join(cwd, "./build/handler.js");
var handlerTSPath = import_path.default.join(cwd, "./build/handler.ts");
var handlerZipPath = import_path.default.join(cwd, "./build/handler.zip");
var appJSPath = import_path.default.join(cwd, "./build/App.js");
var clientPublicPath = import_path.default.join(cwd, "./decltr/client/public");
var clientSrcPath = import_path.default.join(cwd, "./decltr/client/src");

// decltr/scripts/src/ts-ast.ts
var main = async () => {
  const res = await (0, import_core.parseFile)(appTSPath, { syntax: "typescript" });
  console.log(res.body);
};
main();
