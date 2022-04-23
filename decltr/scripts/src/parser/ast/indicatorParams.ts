import { Pattern } from "@swc/core";

const indicatorParams = (params: Array<Pattern>): Array<string> => {
    const indicatorParam = params[1];
    if (!indicatorParam) {
        return [];
    }
    if (indicatorParam.type === "Identifier") {
        if (!isUnderScore(indicatorParam.value)) {
            throw new SyntaxError(
                `second parameter of strategy must either be an object destructuring or not used or all underscores (_). got "${indicatorParam.value}"`
            );
        }
        return [];
    }
    if (indicatorParam.type !== "ObjectPattern") {
        throw new SyntaxError(
            `second parameter of strategy must either be an object destructuring or not used or all underscores (_). got "${indicatorParam.type}"`
        );
    }

    const res: Array<string> = [];
    for (const prop of indicatorParam.properties) {
        if (prop.type === "RestElement") {
            throw new SyntaxError(
                `second parameter of strategy cannot use rest / spread syntax. it cannot be determined what keys are being used`
            );
        }
        if (prop.key.type !== "Identifier") {
            throw new SyntaxError(
                `second parameter of strategy must include keys and / or value mappings. i.e Identifiers, got "${prop.key.type}"`
            );
        }
        res.push(prop.key.value);
    }
    return res;
};

export default indicatorParams;

const isUnderScore = (x: string) => {
    for (let i = 0; i < x.length; i++) {
        if (x[i] !== "_") {
            return false;
        }
    }
    return true;
};
