import https from "https";
import { URL } from "url";

export const GET = async <T = any>(url: string): Promise<T> => {
    return new Promise<T>((res, rej) => {
        https
            .get(url, (resp) => {
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
            })
            .on("error", (err) => rej(err));
    });
};

export const POST = async <T = any>(
    url: string,
    data: string,
    headers: any
): Promise<T> => {
    return new Promise((res, rej) => {
        const urlOpts = new URL(url);

        console.log(urlOpts);

        const req = https.request(
            {
                protocol: urlOpts.protocol,
                hostname: urlOpts.hostname,
                port: urlOpts.port,
                path: urlOpts.pathname,
                method: "POST",
                headers,
            },
            (resp) => {
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
            }
        );

        req.on("error", (err) => rej(err));
        req.write(data);
        req.end();
    });
};
