import {z} from "zod";
import {DataClass} from "./types";
import {Pretty, ZodObjectTypes} from "./type-utils";

export type Copiable<T, I> = {
    copy(copy: Partial<T>): I & Copiable<T, I>
};

export function data<
    T extends ZodObjectTypes,
    M extends { [key: string]: (this: InstanceType, ...args: any[]) => any },
    C extends Copiable<SchemaType, InstanceType>,
    B extends DataClass<any, any> | null = null,
    BaseInstanceType = B extends DataClass<any, infer U> ? U : {},
    BaseDataType = B extends DataClass<infer U, any> ? U : {},
    SchemaType = Pretty<z.infer<T> & BaseDataType>,
    InstanceType = Pretty<C & BaseInstanceType & SchemaType & M>
>(options: {
    schema: T,
    methods: M,
    base?: B
}): DataClass<SchemaType, InstanceType> {
    const schema = options.base
        ? (options.base.schema.and(options.schema) as z.ZodTypeAny)
        : options.schema;

    function DataConstructor(input: SchemaType): InstanceType {
        const create = (data: any) => {
            const parsed = schema.parse(data);
            const instance = options.base
                ? options.base(data)
                : Object.create(DataConstructor.prototype);

            Object.assign(instance, parsed);
            Object.assign(instance, options.methods);
            Object.assign(instance, {
                copy(partial: any) {
                    const updated = {
                        ...data,
                        ...partial,
                    }
                    return create(updated)
                }
            })
            return instance
        }

        const instance = create(input)

        return instance as InstanceType;
    }

    (DataConstructor as any).schema = schema;

    return DataConstructor as DataClass<SchemaType, InstanceType>;
}