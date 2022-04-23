import { parseFile } from "@swc/core";

import { appTSPath } from "../env";
import {
    eventExtension,
    getParams,
    indicatorParams,
    InterfaceJSON,
} from "./ast";
import production from "./production";

export { production };

export interface BaseParserResponse {
    eventSchema: InterfaceJSON;
    indicators: Array<string>;
}

export const baseParser = async (): Promise<BaseParserResponse> => {
    const { body: ast } = await parseFile(appTSPath, { syntax: "typescript" });

    const [functionParams, typeParams] = getParams(ast);

    const eventSchema =
        typeParams.length > 0 ? eventExtension(ast, typeParams[0]) : {};
    const indicators = indicatorParams(functionParams);

    return {
        eventSchema,
        indicators
    };
};
