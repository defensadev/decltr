import crypto from "crypto";
import { stringify } from "qs";

// @ts-ignore
import { KRAKEN_API_KEY, KRAKEN_PRIVATE_KEY } from "./_SECRETS";
import { POST } from "./httpClient";
import { KrakenOrderResponse, Order } from "./types";

export const placeOrder = async (order: Order) => {
    const path = "/0/private/AddOrder";
    const url = "https://api.kraken.com/0/private/AddOrder";
    const nonce = new Date().getTime();

    const payload = { nonce, ...order };
    const message = stringify(payload);
    const secret_buffer = Buffer.from(KRAKEN_PRIVATE_KEY, "base64");
    const hash = crypto.createHash("sha256");
    const hmac = crypto.createHmac("sha512", secret_buffer);
    const hash_digest = hash.update(nonce + message).digest("binary");
    const apiSign = hmac.update(path + hash_digest, "binary").digest("base64");

    const headers = {
        "API-Key": KRAKEN_API_KEY,
        "API-Sign": apiSign,
        "User-Agent": "decltr",
    };

    return await POST<KrakenOrderResponse>(url, message, headers);

    // return await needle("post", url, message, { headers }).then(
    //   (res) => res.body as KrakenOrderResponse
    // );
};

export * from "./types";
export * from "./indicators";
