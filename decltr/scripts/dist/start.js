var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};

// decltr/scripts/src/start.ts
var import_cors = __toESM(require("cors"));
var import_express3 = __toESM(require("express"));
var import_http = require("http");
var import_morgan = __toESM(require("morgan"));
var import_ws = require("ws");

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

// decltr/lib/httpClient.ts
var import_https = __toESM(require("https"));
var GET = async (url) => {
  return new Promise((res, rej) => {
    import_https.default.get(url, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        try {
          const jsonResp = JSON.parse(data);
          if (Array.isArray(jsonResp.error) && jsonResp.error.length > 0) {
            throw new Error(jsonResp.error[0]);
          }
          res(jsonResp);
        } catch (err) {
          rej(err);
        }
      });
    }).on("error", (err) => rej(err));
  });
};

// decltr/scripts/src/server/apiRouter.ts
var import_express = require("express");
var apiRouter = (0, import_express.Router)();
apiRouter.get("/AssetPairs", async (_, res) => {
  try {
    const url = "https://api.kraken.com/0/public/AssetPairs";
    const krakenResp = await GET(url);
    if (krakenResp.error.length > 0) {
      throw new Error(krakenResp.error[0]);
    }
    const result = Object.keys(krakenResp.result).map((pair) => ({
      pair,
      base: krakenResp.result[pair].base,
      quote: krakenResp.result[pair].quote,
      maker_fee: krakenResp.result[pair].fees_maker[0][1],
      taker_fee: krakenResp.result[pair].fees[0][1]
    }));
    result.sort((a, b) => {
      const aUSD = a.quote.includes("USD");
      const bUSD = b.quote.includes("USD");
      if (aUSD && !bUSD) {
        return -1;
      }
      if (!aUSD && bUSD) {
        return 1;
      }
      return a.base.charCodeAt(0) - b.base.charCodeAt(0);
    });
    res.status(200).json({ result });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});
var apiRouter_default = apiRouter;

// decltr/scripts/src/server/staticRouter.ts
var import_express2 = require("express");
var import_fs = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var staticRouter = (0, import_express2.Router)();
staticRouter.get("/*", async (_, res) => {
  try {
    const singlePage = await import_fs.default.promises.readFile(import_path2.default.join(clientPublicPath, "index.html"), "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(singlePage);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});
var staticRouter_default = staticRouter;

// decltr/scripts/src/parser/development.ts
var import_esbuild = require("esbuild");

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

// decltr/scripts/src/parser/development.ts
var development = async () => {
  const res = baseParser();
  await (0, import_esbuild.build)({
    bundle: true,
    entryPoints: [appTSPath],
    legalComments: "linked",
    outfile: appJSPath,
    platform: "node",
    target: "node14",
    write: true
  });
  return await res;
};
var development_default = development;

// decltr/scripts/src/server/wsRouter.ts
var import_chokidar = __toESM(require("chokidar"));

// decltr/lib/indicators.ts
var assetPair = async ({ pair }) => {
  const url = "https://api.kraken.com/0/public/AssetPairs?pair=" + pair;
  const res = await GET(url);
  return res.result[pair];
};
var __OHLC__DEV = async ({ pair, interval }) => {
  const url = "https://api.kraken.com/0/public/OHLC?pair=" + pair + "&interval=" + interval;
  const res = await GET(url);
  return res.result[pair];
};

// decltr/scripts/src/server/Market.ts
var import_lru_native2 = __toESM(require("lru-native2"));
var marketCache = new import_lru_native2.default({
  maxElements: 6
});
var Market = class {
  constructor() {
    this.graphResult = {
      BuyOrders: [],
      SellOrders: [],
      prices: []
    };
    this.pendingOrders = [];
    this.closeOrders = [];
  }
  getApp() {
    delete require.cache[appJSPath];
    return require(appJSPath).default;
  }
  handleOrders(ask, time) {
    const ordersToExecute = [];
    for (let i = 0; i < this.pendingOrders.length; i++) {
      const pendingOrder = this.pendingOrders[i];
      const isSell = pendingOrder.type === "sell";
      const orderBook = isSell ? this.graphResult.SellOrders : this.graphResult.BuyOrders;
      if (pendingOrder.ordertype === "market") {
        orderBook.push({ order: pendingOrder, x: time, y: ask });
        pendingOrder.close && this.closeOrders.push(pendingOrder);
        ordersToExecute.push(i);
        continue;
      }
      if (pendingOrder.ordertype === "limit") {
        const limitPriceStr = pendingOrder.price;
        const limitPrice = parseFloat(limitPriceStr);
        const canExecute = isSell !== ask <= limitPrice;
        if (canExecute) {
          orderBook.push({ order: pendingOrder, x: time, y: ask });
          pendingOrder.close && this.closeOrders.push(pendingOrder);
          ordersToExecute.push(i);
        }
        continue;
      }
      throw new Error("ordertype of type: " + pendingOrder.ordertype + " is not supported at this time!");
    }
    if (ordersToExecute.length > 0) {
      this.pendingOrders = this.pendingOrders.filter((_, i) => !ordersToExecute.includes(i));
    }
  }
  handleCloseOrders(ask, time) {
    const ordersToExecute = [];
    for (let i = 0; i < this.closeOrders.length; i++) {
      const closeOrder = this.closeOrders[i].close;
      if (closeOrder.ordertype === "limit") {
        const prevOrder = this.closeOrders[i];
        const isSell = prevOrder.type === "buy";
        const orderBook = isSell ? this.graphResult.SellOrders : this.graphResult.BuyOrders;
        const limitPriceStr = closeOrder.price;
        const limitPrice = parseFloat(limitPriceStr);
        const canExecute = isSell !== ask <= limitPrice;
        if (canExecute) {
          orderBook.push({
            order: {
              ordertype: "limit",
              type: isSell ? "sell" : "buy",
              pair: prevOrder.pair,
              volume: prevOrder.volume,
              price: ask.toString()
            },
            x: time,
            y: ask
          });
          ordersToExecute.push(i);
        }
        continue;
      }
      throw new Error("close ordertype of type: " + closeOrder.ordertype + " is not supported at this time!");
    }
    if (ordersToExecute.length > 0) {
      this.closeOrders = this.closeOrders.filter((_, i) => !ordersToExecute.includes(i));
    }
  }
  async getAssetPair(devEvent) {
    return await assetPair(devEvent);
  }
  async getOHLC(devEvent) {
    return await __OHLC__DEV(devEvent);
  }
  getTickers(OHLCs) {
    const res = [];
    const todayOpen = OHLCs[0][1];
    let currHighStr = OHLCs[0][2];
    let currLowStr = OHLCs[0][3];
    let currVWAPStr = OHLCs[0][5];
    let currVolumeStr = OHLCs[0][6];
    let currHigh = parseFloat(currHighStr);
    let currLow = parseFloat(currLowStr);
    let currVWAP = parseFloat(currVWAPStr);
    let currVolume = parseFloat(currVolumeStr);
    for (let i = 0; i < OHLCs.length; i++) {
      const [_, __, high, low, close, vwap, volume, ___] = OHLCs[i];
      const a = [high, "1", "1.00"];
      const b = [low, "1", "1.00"];
      const c = [close, "0"];
      const parsedHigh = parseFloat(high);
      const parsedLow = parseFloat(low);
      const parsedVWAP = parseFloat(vwap);
      const parsedVolume = parseFloat(volume);
      if (parsedHigh > currHigh) {
        currHigh = parsedHigh;
        currHighStr = high;
      }
      if (parsedLow < currLow) {
        currLow = parsedLow;
        currLowStr = low;
      }
      currVWAP = currVWAP * currVolume + parsedVWAP * parsedVolume;
      currVolume += parsedVolume;
      currVolumeStr = currVolume.toString();
      currVWAPStr = currVWAP.toString();
      res.push({
        a,
        b,
        c,
        v: [currVolumeStr, currVolumeStr],
        p: [currVWAPStr, currVWAPStr],
        t: [100, 100],
        l: [currLowStr, currLowStr],
        h: [currHighStr, currHighStr],
        o: todayOpen
      });
    }
    return res;
  }
  async *getIndicators(devEvent) {
    const [assetPairRes, OHLCs] = await Promise.all([
      this.getAssetPair(devEvent),
      this.getOHLC(devEvent)
    ]);
    const tickers = this.getTickers(OHLCs);
    for (let i = 0; i < OHLCs.length; i++) {
      yield {
        ticker: tickers[i],
        OHLC: OHLCs.slice(0, i),
        assetPair: assetPairRes
      };
    }
  }
  async handleDevEvent(devEvent) {
    const App = this.getApp();
    let time = 0;
    for await (const indicator of this.getIndicators(devEvent)) {
      const ask = parseFloat(indicator.ticker.a[0]);
      this.graphResult.prices.push(ask);
      const order = App(devEvent, indicator);
      order && this.pendingOrders.push(order);
      this.pendingOrders.length > 0 && this.handleOrders(ask, time);
      this.closeOrders.length > 0 && this.handleCloseOrders(ask, time);
      time++;
    }
    const res = JSON.stringify({ graphResult: this.graphResult });
    this.graphResult = {
      prices: [],
      BuyOrders: [],
      SellOrders: []
    };
    this.closeOrders = [];
    this.pendingOrders = [];
    return res;
  }
};
__decorateClass([
  cache(["pair"])
], Market.prototype, "getAssetPair", 1);
__decorateClass([
  cache(["pair", "interval"])
], Market.prototype, "getOHLC", 1);
var Market_default = Market;
function cache(propKeys) {
  return function(_, __, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function(...args) {
      const ev = args[0];
      const cacheKey = propKeys.reduce((prev, propKey) => prev + ev[propKey], "");
      if (cacheKey in marketCache) {
        return marketCache.get(cacheKey);
      }
      const value = await original(...args);
      marketCache.set(cacheKey, value);
      return value;
    };
    return descriptor;
  };
}

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  const styles2 = {
    modifier: {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      overline: [53, 55],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29]
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      blackBright: [90, 39],
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39]
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgBlackBright: [100, 49],
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49]
    }
  };
  styles2.color.gray = styles2.color.blackBright;
  styles2.bgColor.bgGray = styles2.bgColor.bgBlackBright;
  styles2.color.grey = styles2.color.blackBright;
  styles2.bgColor.bgGrey = styles2.bgColor.bgBlackBright;
  for (const [groupName, group] of Object.entries(styles2)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles2[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles2[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles2, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles2, "codes", {
    value: codes,
    enumerable: false
  });
  styles2.color.close = "\x1B[39m";
  styles2.bgColor.close = "\x1B[49m";
  styles2.color.ansi = wrapAnsi16();
  styles2.color.ansi256 = wrapAnsi256();
  styles2.color.ansi16m = wrapAnsi16m();
  styles2.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles2.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles2.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles2, {
    rgbToAnsi256: {
      value: (red, green, blue) => {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value: (hex) => {
        const matches = /(?<colorString>[a-f\d]{6}|[a-f\d]{3})/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let { colorString } = matches.groups;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles2.rgbToAnsi256(...styles2.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value: (code) => {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles2.ansi256ToAnsi(styles2.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles2.ansi256ToAnsi(styles2.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles2;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
var import_node_process = __toESM(require("node:process"), 1);
var import_node_os = __toESM(require("node:os"), 1);
var import_node_tty = __toESM(require("node:tty"), 1);
function hasFlag(flag, argv = import_node_process.default.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = import_node_process.default;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (import_node_process.default.platform === "win32") {
    const osRelease = import_node_os.default.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app":
        return version >= 3 ? 3 : 2;
      case "Apple_Terminal":
        return 2;
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, __spreadValues({
    streamIsTTY: stream && stream.isTTY
  }, options));
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: import_node_tty.default.isatty(1) }),
  stderr: createSupportsColor({ isTTY: import_node_tty.default.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles = /* @__PURE__ */ Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === void 0 ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk2 = (...strings) => strings.join(" ");
  applyOptions(chalk2, options);
  Object.setPrototypeOf(chalk2, createChalk.prototype);
  return chalk2;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {
}, __spreadProps(__spreadValues({}, styles), {
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
}));
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// decltr/scripts/src/server/logger.ts
var logger = (protocol, msg) => {
  const time = new Date().toISOString();
  console.log(`${source_default.blue(protocol)} - ${source_default.green(msg)} - ${source_default.magenta(time)}`);
};
var logger_default = logger;

// decltr/scripts/src/server/wsRouter.ts
var state = {
  isSrcListenerDone: true,
  isMarketDone: true,
  eventSchema: null
};
var srcWatcher = import_chokidar.default.watch(srcPath, { ignoreInitial: true });
var wsRouter = (ws) => {
  logger_default("WS", "connect");
  const market = new Market_default();
  const listener = () => {
    if (!state.isSrcListenerDone) {
      return;
    }
    state.isSrcListenerDone = false;
    development_default().then((res) => {
      state.eventSchema = res.eventSchema;
      return sendWS(ws, JSON.stringify({ eventSchema: res.eventSchema }));
    }).catch((err) => sendWS(ws, JSON.stringify({ err: err.message }))).finally(() => {
      logger_default("COMPILER", "eventSchema parsed");
      state.isSrcListenerDone = true;
    });
  };
  srcWatcher.on("change", listener);
  ws.addEventListener("message", (ev) => {
    if (!state.isMarketDone) {
      return;
    }
    const msg = ev.data.toString("utf-8");
    state.isMarketDone = false;
    market.handleDevEvent(JSON.parse(msg)).then((res) => sendWS(ws, res)).catch((err) => sendWS(ws, JSON.stringify({ err: err.message }))).finally(() => {
      logger_default("MARKET", "response");
      state.isMarketDone = true;
    });
  });
  ws.addEventListener("close", () => {
    logger_default("WS", "close");
    srcWatcher.removeListener("change", listener);
    ws.removeAllListeners();
  });
  if (!state.eventSchema) {
    listener();
    return;
  }
  sendWS(ws, JSON.stringify({ eventSchema: state.eventSchema }));
};
var wsRouter_default = wsRouter;
var sendWS = async (ws, msg) => {
  if (ws.readyState === ws.OPEN) {
    ws.send(msg);
    return null;
  }
  if (ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
    throw new Error(`ws CLOSED or CLOSING. cannot send message: "${msg}"`);
  }
  return new Promise((res, rej) => {
    const closeL = () => {
      ws.removeListener("close", closeL);
      ws.removeListener("open", openL);
      rej(new Error(`ws CLOSED or CLOSING. cannot send message: "${msg}"`));
    };
    const openL = () => {
      ws.removeListener("open", openL);
      ws.removeListener("close", closeL);
      ws.send(msg);
      res(null);
    };
    ws.addEventListener("open", openL);
    ws.addEventListener("close", closeL);
  });
};

// decltr/scripts/src/start.ts
var expressApp = (0, import_express3.default)();
var httpServer = (0, import_http.createServer)(expressApp);
var webSocketServer = new import_ws.WebSocketServer({ noServer: true });
expressApp.use((0, import_morgan.default)("dev"));
expressApp.use((0, import_cors.default)());
expressApp.use("/api", apiRouter_default);
expressApp.use("/", import_express3.default.static(clientPublicPath));
expressApp.use("/", staticRouter_default);
httpServer.on("upgrade", (request, socket, head) => webSocketServer.handleUpgrade(request, socket, head, (ws) => webSocketServer.emit("connection", ws, request)));
webSocketServer.addListener("connection", (ws) => wsRouter_default(ws));
httpServer.listen(4e3, () => console.log("listening on port 4000..."));
