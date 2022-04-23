# Static Analysis

**_Static analysis_** is the analysis of source code without execution. That is to say, anything done at "compile time" is in someway static analysis or indirectly used during static analysis.

## Naming Resolution

**_Naming Resolution_** is resolving the references or identifiers within a expression. For example:

```ts
interface Props<T> {
  myProperty: T;
}

function App(props: Props<string>) {
  props.myProperty; // is of type "string"
}
```

Here, it can be infered that _props.myProperty_ is of type "string". This is inferable from naming resolution. We can infer that this really means something like this:

```ts
function App(props: { myProperty: string }) {
  props.myProperty; // is of type "string"
}
```

Roadmap for **_Decltr_** has plans for naming resolution to help solve some **"brittleness"** in the framework. For example this should be a valid App.ts source file (although it definetly could be cleaned up...).

```ts
import { Strat as StratRenamed } from "decltr";
import { IndicatorsI } from "./indicators";

interface EventI<T = number> {
  volume: T;
}

let App: StratRenamed<EventI<string>, IndicatorsI>;

App = () => null;

const MyExportedApp = App;

export default MyExportedApp;
```

There's a lot going on here for naming resolution.

- Renaming Start as StratRenamed
- Using an imported "IndicatorsI"
- Using a generic for "EventI"
- Using let but defining App later on
- Using MyExportedApp as the export rather than App directly

## Type checking

Roadmap for **_Decltr_** has plans for **"fast"** type checking. That means no need to use tsc anymore during start but only build. Fast type checking will include

- default export for entry point is of type "Strat"
- functions with the type "Strat" must return null or Order
