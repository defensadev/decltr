import { KrakenAssetPair } from "decltr/lib";
import { GET } from "decltr/lib/httpClient";
import { Router } from "express";

const apiRouter = Router();

apiRouter.get("/AssetPairs", async (_, res) => {
    try {
        const url = "https://api.kraken.com/0/public/AssetPairs";

        const krakenResp = await GET<KrakenAssetPair>(url);

        if (krakenResp.error.length > 0) {
            throw new Error(krakenResp.error[0]);
        }

        const result = Object.keys(
            krakenResp.result
        ).map<DecltrAPIAssetPairsResponse>((pair) => ({
            pair,
            base: krakenResp.result[pair].base,
            quote: krakenResp.result[pair].quote,
            maker_fee: krakenResp.result[pair].fees_maker[0][1],
            taker_fee: krakenResp.result[pair].fees[0][1],
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

export default apiRouter;

interface DecltrAPIAssetPairsResponse {
    base: string;
    quote: string;
    pair: string;
    maker_fee: number;
    taker_fee: number;
}
