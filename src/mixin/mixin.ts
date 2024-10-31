import {DataClass} from "../types";

export function mixin<Base extends DataClass<any, any>, Mixed extends DataClass<any, any>>(Base: Base, mixin: (base: Base) => Mixed): Mixed {
    return mixin(Base)
}