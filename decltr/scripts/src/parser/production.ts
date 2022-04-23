import { baseParser } from "./index";
import printer, { ImportI } from "./printer";

const production = async (): Promise<ProductionResponse> => {
    const { eventSchema, indicators } = await baseParser();

    const imports = indicators.map<ImportI>((indicator) => ({
        item: indicator,
        src: "../decltr/lib",
    }));

    const eventSchemaStr = JSON.stringify(eventSchema);

    return {
        handler: printer({
            imports,
            indicators,
        }),
        eventSchema: eventSchemaStr,
    };
};

export default production;

interface ProductionResponse {
    handler: string;
    eventSchema: string;
}
