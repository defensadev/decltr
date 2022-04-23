import {
    ModuleItem,
    TsType,
    TsTypeLiteral,
    TsTypeElement,
    TsKeywordType,
    TsTypeReference,
} from "@swc/core";

export interface InterfaceJSON {
    // right now you can only pass primitives to your app inside the event object
    [key: string]: {
        type: "string" | "number" | "boolean" | "null";
        optional: boolean;
    };
}
const VALID_TYPES = ["string", "number", "boolean", "null"];

const eventExtension = (
    ast: Array<ModuleItem>,
    typeParam: TsType
): InterfaceJSON => {
    if (typeParam.type === "TsTypeReference") {
        const param = typeParam as TsTypeReference;
        if (!param.typeName) {
            throw new SyntaxError(
                `event extension must of type TsTypeReference (using an interface followed by Strat<I>) or TsTypeLiteral (Strat<{ types here... }>). got "TsImportType"`
            );
        }
        if (param.typeName.type === "TsQualifiedName") {
            throw new SyntaxError(
                `event extension must of type Identifer (using an interface followed by Strat<I>). got "TsQualifiedName"`
            );
        }

        const members = findInterfaceMembers(ast, param.typeName.value);
        return typeElementsToIJSON(members);
    }
    if (typeParam.type === "TsTypeLiteral") {
        const param = typeParam as TsTypeLiteral;
        if (!param.members) {
            throw new Error(
                `event extension must of type TsTypeReference (using an interface followed by Strat<I>) or TsTypeLiteral (Strat<{ types here... }>). got "TsImportType"`
            );
        }
        return typeElementsToIJSON(param.members);
    }

    throw new SyntaxError(
        `event extension must of type TsTypeReference (using an interface followed by Strat<I>) or TsTypeLiteral (Strat<{ types here... }>). got "${typeParam.type}"`
    );
};

export default eventExtension;

const typeElementsToIJSON = (typeEls: Array<TsTypeElement>): InterfaceJSON => {
    const res: InterfaceJSON = {
        pair: {
            type: "string",
            optional: false,
        },
    };

    for (const typeEl of typeEls) {
        if (typeEl.type !== "TsPropertySignature") {
            throw new SyntaxError(
                `type within event extension must of type TsPropertySignature. got "${typeEl.type}". try making your interface fixed i.e:\n\n{\nmyProperty: string;\n}\n`
            );
        }
        if (typeEl.key.type !== "Identifier") {
            throw new SyntaxError(
                `key within event extension must of type Identifier. got "${typeEl.key.type}". try making your interface fixed i.e:\n\n{\nmyProperty: string;\n}\n`
            );
        }
        if (
            !typeEl.typeAnnotation ||
            typeEl.typeAnnotation.typeAnnotation.type !== "TsKeywordType"
        ) {
            throw new SyntaxError(
                `value within event extension must of type TsKeywordType (string | number | boolean | null). try making your interface fixed i.e:\n\n{\nmyProperty: string;\n}\n`
            );
        }
        const tsKeyword = typeEl.typeAnnotation.typeAnnotation as TsKeywordType;
        if (!VALID_TYPES.includes(tsKeyword.kind)) {
            throw new SyntaxError(
                `value within event extension must of type TsKeywordType (string | number | boolean | null). try making your interface fixed i.e:\n\n{\nmyProperty: string;\n}\n`
            );
        }

        // this ts ignore is allowed, notice how we check above that kind is within VALID_TYPES
        // this is the same, but much easier than checking indivual cases i.e (is string, is number, etc...).
        res[typeEl.key.value] = {
            // @ts-ignore
            type: tsKeyword.kind,
            optional: typeEl.optional,
        };
    }

    return res;
};

const findInterfaceMembers = (
    ast: Array<ModuleItem>,
    interfaceName: string
): Array<TsTypeElement> => {
    for (const el of ast) {
        if (el.type === "TsInterfaceDeclaration" && el.id.value === interfaceName) {
            return el.body.body;
        }
    }

    throw new SyntaxError(
        `unable to resolve event extension "${interfaceName}". is your interface declared locally and is an "interface" not a "type"?`
    );
};
