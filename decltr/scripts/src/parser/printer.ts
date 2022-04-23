export interface ImportI {
    item: string;
    src: string;
    default?: boolean;
}

interface Props {
    imports: Array<ImportI>;
    indicators: Array<string>;
}

const printer = (props: Props) => {
    props.imports.push({
        item: "App",
        src: "../src/App",
        default: true,
    });
    props.imports.push({
        item: "placeOrder",
        src: "../decltr/lib",
    });

    const importSection = props.imports.reduce((prev, curr) => {
        const importName = curr.default ? curr.item : `{ ${curr.item} }`;
        return prev + `import ${importName} from "${curr.src}";\n`;
    }, "");

    const indicatorArrSection =
        props.indicators.join("(ev), ") +
        (props.indicators.length > 0 ? "(ev)" : "");
    const indicatorObjSection = props.indicators.reduce((prev, curr, i) => {
        return prev + `${curr}: indicatorArr[${i}],\n`;
    }, "");

    return `
    ${importSection}

    export const handler = async (ev) => {
        const indicatorArr = await Promise.all([${indicatorArrSection}]);
        const indicatorObj = {
            ${indicatorObjSection}
        };
        const order = App(ev, indicatorObj);
        if (!order) {
            return null;
        }
        return await placeOrder(order);
    };
    `;
};

export default printer;
