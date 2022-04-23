import { ModuleItem, Pattern, TsType, TsTypeReference } from "@swc/core";

const getParams = (ast: Array<ModuleItem>): [Array<Pattern>, Array<TsType>] => {
    let appName: undefined | string = undefined;
    for (const el of ast) {
        if (el.type === "ExportDefaultExpression") {
            if (el.expression.type === "Identifier") {
                appName = el.expression.value;
            }
            break;
        }
    }

    if (appName === undefined) {
        throw new SyntaxError(
            "no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;"
        );
    }

    for (const el of ast) {
        if (
            el.type === "VariableDeclaration" &&
            el.kind === "const" &&
            el.declarations.length > 0
        ) {
            const appDecl = el.declarations.filter(
                (decl) => decl.id.type === "Identifier" && decl.id.value === appName
            )[0];
            if (!appDecl) {
                continue;
            }

            if (
                !appDecl.init ||
                appDecl.init.type !== "ArrowFunctionExpression" ||
                appDecl.id.type !== "Identifier" ||
                !appDecl.id.typeAnnotation ||
                appDecl.id.typeAnnotation.typeAnnotation.type !== "TsTypeReference"
            ) {
                throw new SyntaxError(
                    "no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;"
                );
            }

            const typeReference = appDecl.id.typeAnnotation
                .typeAnnotation as TsTypeReference;
            // so here is were i would say
            // we are being brittle in terms of framework
            // rather than checking for typeName.value === "Strat" instead allow it to be anything
            // but source back to the "Strat" import statement
            // refer to naming resolution in static-analysis.md
            if (
                typeReference.typeName.type !== "Identifier" ||
                typeReference.typeName.value !== "Strat"
            ) {
                throw new SyntaxError(
                    "no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;"
                );
            }

            const typeParams = typeReference.typeParams?.params
                ? typeReference.typeParams.params
                : [];

            return [appDecl.init.params, typeParams];
        }
    }

    throw new SyntaxError(
        "no constant strat typed arrow function default export. must be in form:\n\nconst App: Strat = () => {\n...\n};\n\nexport default App;"
    );
};

export default getParams;
