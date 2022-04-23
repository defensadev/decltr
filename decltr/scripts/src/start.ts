import cors from "cors";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { WebSocketServer } from "ws";

import { clientPublicPath } from "./env";
import apiRouter from "./server/apiRouter";
import staticRouter from "./server/staticRouter";
import wsRouter from "./server/wsRouter";

const expressApp = express();
const httpServer = createServer(expressApp);
const webSocketServer = new WebSocketServer({ noServer: true });

expressApp.use(morgan("dev"));
expressApp.use(cors());
expressApp.use("/api", apiRouter);
expressApp.use("/", express.static(clientPublicPath));
expressApp.use("/", staticRouter);

httpServer.on("upgrade", (request, socket, head) =>
  webSocketServer.handleUpgrade(request, socket, head, (ws) =>
    webSocketServer.emit("connection", ws, request)
  )
);

webSocketServer.addListener("connection", (ws) => wsRouter(ws));

httpServer.listen(4000, () => console.log("listening on port 4000..."));
