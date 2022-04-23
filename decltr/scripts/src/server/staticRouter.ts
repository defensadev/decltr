import { Router } from "express";
import fs from "fs";
import path from "path";

import { clientPublicPath } from "../env";

const staticRouter = Router();

staticRouter.get("/*", async (_, res) => {
    try {
        const singlePage = await fs.promises.readFile(
            path.join(clientPublicPath, "index.html"),
            "utf-8"
        );

        res.setHeader("Content-Type", "text/html");
        res.status(200).send(singlePage);
    } catch (err) {
        res.status(400).json({ err: err.message });
    }
});

export default staticRouter;
