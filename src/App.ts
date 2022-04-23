import { Strat } from "../decltr/lib";

const App: Strat<EventI> = (
  { pair, profit, volume, post },
  { ticker, assetPair }
) => {
  const ask = parseFloat(ticker.a[0]);
  const vwap = parseFloat(ticker.p[1]);

  if (ask > vwap) {
    return null;
  }

  const baseFee = post ? assetPair.fees_maker[0][1] : assetPair.fees[0][1];
  const fee = baseFee / 100;
  const sVol = volume.toFixed(assetPair.lot_decimals);
  const sellingPrice = (
    (profit + ask * volume * (1 + fee)) /
    (volume * (1 - fee))
  ).toFixed(assetPair.pair_decimals);

  return {
    pair,
    volume: sVol,
    price: ticker.a[0],
    type: "buy",
    ordertype: "limit",
    close: {
      ordertype: "limit",
      price: sellingPrice,
    },
    expiretm: "+10",
    oflags: post ? "post" : undefined,
  };
};

export default App;

interface EventI {
  /**
   * profit per trade
   */
  profit: number;
  /**
   * volume per trade
   */
  volume: number;
  /**
   * whether to "post" the order, ensures maker fees if true
   */
  post?: boolean;
}
