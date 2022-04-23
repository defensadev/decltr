import {
  TOHLCVVC,
  Indicators,
  Ticker,
  Order,
  Strat,
  CloseOrder,
} from "decltr/lib";
import { assetPair, __OHLC__DEV } from "decltr/lib/indicators";
import LRUCache from "lru-native2";
import { appJSPath } from "../env";

const marketCache = new LRUCache({
  maxElements: 6,
} as any);

interface GraphResult {
  BuyOrders: Array<{ order: Order; x: number; y: number }>;
  SellOrders: Array<{ order: Order; x: number; y: number }>;
  prices: Array<number>;
}

class Market {
  graphResult: GraphResult;
  pendingOrders: Array<Order>;
  closeOrders: Array<Order>;

  constructor() {
    this.graphResult = {
      BuyOrders: [],
      SellOrders: [],
      prices: [],
    };
    this.pendingOrders = [];
    this.closeOrders = [];
  }

  getApp(): Strat {
    delete require.cache[appJSPath];
    return require(appJSPath).default;
  }

  handleOrders(ask: number, time: number) {
    const ordersToExecute: Array<number> = [];

    for (let i = 0; i < this.pendingOrders.length; i++) {
      const pendingOrder = this.pendingOrders[i];
      const isSell = pendingOrder.type === "sell";
      const orderBook = isSell
        ? this.graphResult.SellOrders
        : this.graphResult.BuyOrders;

      if (pendingOrder.ordertype === "market") {
        orderBook.push({ order: pendingOrder, x: time, y: ask });
        pendingOrder.close && this.closeOrders.push(pendingOrder);
        ordersToExecute.push(i);
        continue;
      }
      if (pendingOrder.ordertype === "limit") {
        const limitPriceStr = pendingOrder.price as string;
        const limitPrice = parseFloat(limitPriceStr);
        const canExecute = isSell !== ask <= limitPrice;
        if (canExecute) {
          orderBook.push({ order: pendingOrder, x: time, y: ask });
          pendingOrder.close && this.closeOrders.push(pendingOrder);
          ordersToExecute.push(i);
        }
        continue;
      }
      throw new Error(
        "ordertype of type: " +
          pendingOrder.ordertype +
          " is not supported at this time!"
      );
    }
    if (ordersToExecute.length > 0) {
      this.pendingOrders = this.pendingOrders.filter(
        (_, i) => !ordersToExecute.includes(i)
      );
    }
  }

  handleCloseOrders(ask: number, time: number) {
    const ordersToExecute: Array<number> = [];

    for (let i = 0; i < this.closeOrders.length; i++) {
      const closeOrder = this.closeOrders[i].close as CloseOrder;
      if (closeOrder.ordertype === "limit") {
        const prevOrder = this.closeOrders[i];
        const isSell = prevOrder.type === "buy";
        const orderBook = isSell
          ? this.graphResult.SellOrders
          : this.graphResult.BuyOrders;

        const limitPriceStr = closeOrder.price as string;
        const limitPrice = parseFloat(limitPriceStr);

        const canExecute = isSell !== ask <= limitPrice;
        if (canExecute) {
          orderBook.push({
            order: {
              ordertype: "limit",
              type: isSell ? "sell" : "buy",
              pair: prevOrder.pair,
              volume: prevOrder.volume,
              price: ask.toString(),
            },
            x: time,
            y: ask,
          });
          ordersToExecute.push(i);
        }
        continue;
      }

      throw new Error(
        "close ordertype of type: " +
          closeOrder.ordertype +
          " is not supported at this time!"
      );
    }

    if (ordersToExecute.length > 0) {
      this.closeOrders = this.closeOrders.filter(
        (_, i) => !ordersToExecute.includes(i)
      );
    }
  }

  @cache(["pair"])
  async getAssetPair(devEvent: any) {
    return await assetPair(devEvent);
  }

  @cache(["pair", "interval"])
  async getOHLC(devEvent: any) {
    return await __OHLC__DEV(devEvent);
  }
  getTickers(OHLCs: Array<TOHLCVVC>): Array<Ticker> {
    const res: Array<Ticker> = [];

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
        o: todayOpen,
      });
    }

    return res;
  }

  async *getIndicators(devEvent: any): AsyncGenerator<Indicators> {
    const [assetPairRes, OHLCs] = await Promise.all([
      this.getAssetPair(devEvent),
      this.getOHLC(devEvent),
    ]);
    const tickers = this.getTickers(OHLCs);

    for (let i = 0; i < OHLCs.length; i++) {
      yield {
        ticker: tickers[i],
        OHLC: OHLCs.slice(0, i),
        assetPair: assetPairRes,
      };
    }
  }

  async handleDevEvent(devEvent: any): Promise<string> {
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
      SellOrders: [],
    };
    this.closeOrders = [];
    this.pendingOrders = [];

    return res;
  }
}

export default Market;

function cache(propKeys: Array<string>) {
  return function (_: Object, __: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: Array<any>) {
      const ev = args[0];
      const cacheKey = propKeys.reduce(
        (prev, propKey) => prev + ev[propKey],
        ""
      );
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
