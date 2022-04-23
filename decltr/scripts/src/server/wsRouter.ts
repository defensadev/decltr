import { WebSocket } from "ws";
import { InterfaceJSON } from "../parser/ast";
import development from "../parser/development";
import chokidar from "chokidar";
import { srcPath } from "../env";
import Market from "./Market";
import logger from "./logger";

interface State {
  isSrcListenerDone: boolean;
  isMarketDone: boolean;
  eventSchema: InterfaceJSON | null;
}

const state: State = {
  isSrcListenerDone: true,
  isMarketDone: true,
  eventSchema: null,
};

const srcWatcher = chokidar.watch(srcPath, { ignoreInitial: true });

const wsRouter = (ws: WebSocket) => {
  logger("WS", "connect");
  const market = new Market();

  const listener = () => {
    if (!state.isSrcListenerDone) {
      return;
    }
    state.isSrcListenerDone = false;
    development()
      .then((res) => {
        state.eventSchema = res.eventSchema;
        return sendWS(ws, JSON.stringify({ eventSchema: res.eventSchema }));
      })
      .catch((err) => sendWS(ws, JSON.stringify({ err: err.message })))
      .finally(() => {
        logger("COMPILER", "eventSchema parsed");
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
    market
      .handleDevEvent(JSON.parse(msg))
      .then((res) => sendWS(ws, res))
      .catch((err) => sendWS(ws, JSON.stringify({ err: err.message })))
      .finally(() => {
        logger("MARKET", "response");
        state.isMarketDone = true;
      });
  });

  ws.addEventListener("close", () => {
    logger("WS", "close");
    srcWatcher.removeListener("change", listener);
    ws.removeAllListeners();
  });

  if (!state.eventSchema) {
    listener();
    return;
  }
  sendWS(ws, JSON.stringify({ eventSchema: state.eventSchema }));
};

export default wsRouter;

const sendWS = async (ws: WebSocket, msg: string): Promise<null> => {
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
