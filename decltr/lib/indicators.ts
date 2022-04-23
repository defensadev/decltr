import { GET } from "./httpClient";
import {
  AssetPair,
  Indicator,
  KrakenAssetPair,
  KrakenOHLC,
  KrakenTicker,
  Ticker,
  TOHLCVVC,
} from "./types";

export const ticker: Indicator<Ticker> = async ({ pair }) => {
  const url = "https://api.kraken.com/0/public/Ticker?pair=" + pair;

  const res = await GET<KrakenTicker>(url);

  return res.result[pair];
};

export const assetPair: Indicator<AssetPair> = async ({ pair }) => {
  const url = "https://api.kraken.com/0/public/AssetPairs?pair=" + pair;

  const res = await GET<KrakenAssetPair>(url);

  return res.result[pair];
};

export const OHLC: Indicator<Array<TOHLCVVC>> = async ({ pair }) => {
  const url = "https://api.kraken.com/0/public/OHLC?pair=" + pair;

  const res = await GET<KrakenOHLC>(url);

  return res.result[pair];
};

export const __OHLC__DEV = async ({ pair, interval }: any) => {
  const url =
    "https://api.kraken.com/0/public/OHLC?pair=" +
    pair +
    "&interval=" +
    interval;

  const res = await GET<KrakenOHLC>(url);

  return res.result[pair];
};
