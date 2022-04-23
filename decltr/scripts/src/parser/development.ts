import { build } from "esbuild";
import { baseParser } from ".";
import { appJSPath, appTSPath } from "../env";

const development = async () => {
    const res = baseParser();

    await build({
        bundle: true,
        entryPoints: [appTSPath],
        legalComments: "linked",
        outfile: appJSPath,
        platform: "node",
        target: "node14",
        write: true,
    });

    return await res;
};

export default development;
