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

// decltr/scripts/src/build.ts
var import_archiver = __toESM(require("archiver"));
var import_dotenv = __toESM(require("dotenv"));
var import_env_var = __toESM(require("env-var"));
var import_esbuild = require("esbuild");
var import_fs_extra = __toESM(require("fs-extra"));

// decltr/scripts/src/env.ts
var import_path = __toESM(require("path"));
var cwd = process.cwd();
var srcPath = import_path.default.join(cwd, "./src");
var appTSPath = import_path.default.join(cwd, "./src/App.ts");
var buildPath = import_path.default.join(cwd, "./build");
var handlerJSPath = import_path.default.join(cwd, "./build/handler.js");
var handlerTSPath = import_path.default.join(cwd, "./build/handler.ts");
var handlerZipPath = import_path.default.join(cwd, "./build/handler.zip");
var eventSchemaPath = import_path.default.join(cwd, "./build/event-schema.json");
var appJSPath = import_path.default.join(cwd, "./build/App.js");
var clientPublicPath = import_path.default.join(cwd, "./decltr/client");

// decltr/scripts/src/parser/index.ts
var import_core = require("@swc/core");

// decltr/scripts/src/parser/ast/eventExtension.ts
var VALID_TYPES = ["string", "number", "boolean", "null"];
var eventExtension = (ast, typeParam) => {
  if (typeParam.type === "TsTypeReference") {
    const param = typeParam;
    if (!param.typeName) {
      throw new SyntaxError(`event extension must of type TsTypeReference (using an interface followed by Strat<I>) or TsTypeLiteral (Strat<{ types here... }>). got "TsImportType"`);
    }
    if (param.typeName.type === "TsQualifiedName") {
      throw new SyntaxError(`event extension must of type Identifer (using an interface followed by Strat<I>). got "TsQualifiedName"`);
    }
    const members = findInterfaceMembers(ast, param.typeName.value);
    return typeElementsToIJSON(members);
  }
  if (typeParam.type === "TsTypeLiteral") {
    const param = typeParam;
    if (!param.members) {
      throw new Error(`event extension must of type TsTypeReference (using an interface followed by Strat<I>) or TsTypeLiteral (Strat<{ types here... }>). got "TsImportType"`);
    }
    return typeElementsToIJSON(param.members);
  }
  throw new SyntaxError(`event extension must of type TsTypeReference (using an interface followed by Strat<I>) or TsTypeLiteral (Strat<{ types here... }>). got "${typeParam.type}"`);
};
var eventExtension_default = eventExtension;
var typeElementsToIJSON = (typeEls) => {
  const res = {
    pair: {
      type: "string",
      optional: false
    }
  };
  for (const typeEl of typeEls) {
    if (typeEl.type !== "TsPropertySignature") {
      throw new SyntaxError(`type within event extension must of type TsPropertySignature. got "${typeEl.type}". try making your interface fixed i.e:

{
myProperty: string;
}
`);
    }
    if (typeEl.key.type !== "Identifier") {
      throw new SyntaxError(`key within event extension must of type Identifier. got "${typeEl.key.type}". try making your interface fixed i.e:

{
myProperty: string;
}
`);
    }
    if (!typeEl.typeAnnotation || typeEl.typeAnnotation.typeAnnotation.type !== "TsKeywordType") {
      throw new SyntaxError(`value within event extension must of type TsKeywordType (string | number | boolean | null). try making your interface fixed i.e:

{
myProperty: string;
}
`);
    }
    const tsKeyword = typeEl.typeAnnotation.typeAnnotation;
    if (!VALID_TYPES.includes(tsKeyword.kind)) {
      throw new SyntaxError(`value within event extension must of type TsKeywordType (string | number | boolean | null). try making your interface fixed i.e:

{
myProperty: string;
}
`);
    }
    res[typeEl.key.value] = {
      type: tsKeyword.kind,
      optional: typeEl.optional
    };
  }
  return res;
};
var findInterfaceMembers = (ast, interfaceName) => {
  for (const el of ast) {
    if (el.type === "TsInterfaceDeclaration" && el.id.value === interfaceName) {
      return el.body.body;
    }
  }
  throw new SyntaxError(`unable to resolve event extension "${interfaceName}". is your interface declared locally and is an "interface" not a "type"?`);
};

// decltr/scripts/src/parser/ast/getParams.ts
var getParams = (ast) => {
  var _a;
  let appName = void 0;
  for (const el of ast) {
    if (el.type === "ExportDefaultExpression") {
      if (el.expression.type === "Identifier") {
        appName = el.expression.value;
      }
      break;
    }
  }
  if (appName === void 0) {
    throw new SyntaxError("no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;");
  }
  for (const el of ast) {
    if (el.type === "VariableDeclaration" && el.kind === "const" && el.declarations.length > 0) {
      const appDecl = el.declarations.filter((decl) => decl.id.type === "Identifier" && decl.id.value === appName)[0];
      if (!appDecl) {
        continue;
      }
      if (!appDecl.init || appDecl.init.type !== "ArrowFunctionExpression" || appDecl.id.type !== "Identifier" || !appDecl.id.typeAnnotation || appDecl.id.typeAnnotation.typeAnnotation.type !== "TsTypeReference") {
        throw new SyntaxError("no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;");
      }
      const typeReference = appDecl.id.typeAnnotation.typeAnnotation;
      if (typeReference.typeName.type !== "Identifier" || typeReference.typeName.value !== "Strat") {
        throw new SyntaxError("no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;");
      }
      const typeParams = ((_a = typeReference.typeParams) == null ? void 0 : _a.params) ? typeReference.typeParams.params : [];
      return [appDecl.init.params, typeParams];
    }
  }
  throw new SyntaxError("no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;");
};
var getParams_default = getParams;

// decltr/scripts/src/parser/ast/indicatorParams.ts
var indicatorParams = (params) => {
  const indicatorParam = params[1];
  if (!indicatorParam) {
    return [];
  }
  if (indicatorParam.type === "Identifier") {
    if (!isUnderScore(indicatorParam.value)) {
      throw new SyntaxError(`second parameter of strategy must either be an object destructuring or not used or all underscores (_). got "${indicatorParam.value}"`);
    }
    return [];
  }
  if (indicatorParam.type !== "ObjectPattern") {
    throw new SyntaxError(`second parameter of strategy must either be an object destructuring or not used or all underscores (_). got "${indicatorParam.type}"`);
  }
  const res = [];
  for (const prop of indicatorParam.properties) {
    if (prop.type === "RestElement") {
      throw new SyntaxError(`second parameter of strategy cannot use rest / spread syntax. it cannot be determined what keys are being used`);
    }
    if (prop.key.type !== "Identifier") {
      throw new SyntaxError(`second parameter of strategy must include keys and / or value mappings. i.e Identifiers, got "${prop.key.type}"`);
    }
    res.push(prop.key.value);
  }
  return res;
};
var indicatorParams_default = indicatorParams;
var isUnderScore = (x) => {
  for (let i = 0; i < x.length; i++) {
    if (x[i] !== "_") {
      return false;
    }
  }
  return true;
};

// decltr/scripts/src/parser/printer.ts
var printer = (props) => {
  props.imports.push({
    item: "App",
    src: "../src/App",
    default: true
  });
  props.imports.push({
    item: "placeOrder",
    src: "../decltr/lib"
  });
  const importSection = props.imports.reduce((prev, curr) => {
    const importName = curr.default ? curr.item : `{ ${curr.item} }`;
    return prev + `import ${importName} from "${curr.src}";
`;
  }, "");
  const indicatorArrSection = props.indicators.join("(ev), ") + (props.indicators.length > 0 ? "(ev)" : "");
  const indicatorObjSection = props.indicators.reduce((prev, curr, i) => {
    return prev + `${curr}: indicatorArr[${i}],
`;
  }, "");
  return `
    ${importSection}

    export const handler = async (ev) => {
        const indicatorArr = await Promise.all([${indicatorArrSection}]);
        const indicatorObj = {
            ${indicatorObjSection}
        };
        const order = App(ev, indicatorObj);
        if (!order) {
            return null;
        }
        return await placeOrder(order);
    };
    `;
};
var printer_default = printer;

// decltr/scripts/src/parser/production.ts
var production = async () => {
  const { eventSchema, indicators } = await baseParser();
  const imports = indicators.map((indicator) => ({
    item: indicator,
    src: "../decltr/lib"
  }));
  const eventSchemaStr = JSON.stringify(eventSchema);
  return {
    handler: printer_default({
      imports,
      indicators
    }),
    eventSchema: eventSchemaStr
  };
};
var production_default = production;

// decltr/scripts/src/parser/index.ts
var baseParser = async () => {
  const { body: ast } = await (0, import_core.parseFile)(appTSPath, { syntax: "typescript" });
  const [functionParams, typeParams] = getParams_default(ast);
  const eventSchema = typeParams.length > 0 ? eventExtension_default(ast, typeParams[0]) : {};
  const indicators = indicatorParams_default(functionParams);
  return {
    eventSchema,
    indicators
  };
};

// decltr/scripts/src/build.ts
import_dotenv.default.config();
var KRAKEN_API_KEY = import_env_var.default.get("KRAKEN_API_KEY").required().asString();
var KRAKEN_PRIVATE_KEY = import_env_var.default.get("KRAKEN_PRIVATE_KEY").required().asString();
var envPlugin = {
  name: "envPlugin",
  setup: (build2) => {
    build2.onResolve({ filter: /_SECRETS$/ }, (args) => {
      return {
        path: args.path,
        namespace: "envPlugin-ns"
      };
    });
    build2.onLoad({ filter: /.*/, namespace: "envPlugin-ns" }, () => ({
      contents: JSON.stringify({
        KRAKEN_API_KEY,
        KRAKEN_PRIVATE_KEY
      }),
      loader: "json"
    }));
  }
};
var main = async () => {
  const { handler, eventSchema } = await production_default();
  await import_fs_extra.default.ensureDir(buildPath);
  await import_fs_extra.default.promises.writeFile(eventSchemaPath, eventSchema, "utf-8");
  await import_fs_extra.default.promises.writeFile(handlerTSPath, handler, "utf-8");
  const buildResult = await (0, import_esbuild.build)({
    bundle: true,
    entryPoints: [handlerTSPath],
    legalComments: "linked",
    outfile: handlerJSPath,
    platform: "node",
    minify: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    plugins: [envPlugin],
    target: "node14",
    treeShaking: true,
    write: true,
    metafile: true
  });
  await new Promise((res, rej) => {
    const output = import_fs_extra.default.createWriteStream(handlerZipPath);
    const archive = (0, import_archiver.default)("zip", {
      zlib: { level: 6 }
    });
    output.on("close", () => res(null));
    archive.on("warning", rej);
    archive.on("error", rej);
    archive.pipe(output);
    archive.append(import_fs_extra.default.createReadStream(handlerJSPath), { name: "index.js" });
    archive.append(import_fs_extra.default.createReadStream(eventSchemaPath), {
      name: "event-schema.json"
    });
    archive.finalize();
  });
  const message = await (0, import_esbuild.analyzeMetafile)(buildResult.metafile, { color: true });
  console.log(message);
};
main().catch((err) => console.error(err));
