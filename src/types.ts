import {z} from "zod";
import {Pretty} from "./type-utils";
import {Copiable} from "./data";

export interface DataClass<SchemaType, InstanceType> {
    schema: z.ZodTypeAny;

    (data: SchemaType): InstanceType;

    prototype: InstanceType;
}

export type PolymorphicDataClass<
    Discriminator extends string,
    SchemaType,
    InstanceType,
    BaseSchemaType,
    BaseInstanceType,
    VariantSchemas extends {
        [K in string]: z.ZodObject<any>
    },
    VariantMethods extends {
        [K in keyof VariantSchemas]: {
            [key in string]: (this: Pretty<BaseInstanceType & z.infer<VariantSchemas[K]>>, ...args: any[]) => any
        }
    },
    C extends {
        [K in keyof VariantSchemas]: Copiable<
            Pretty<BaseSchemaType & z.infer<VariantSchemas[K]>>,
            Pretty<BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K }>
        >
    },
> =
    & DataClass<SchemaType, InstanceType>
    & { [K in keyof VariantSchemas]: (data: BaseSchemaType & z.infer<VariantSchemas[K]>) => Pretty<C[K] & BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K }> }
    & { variants: (keyof VariantSchemas)[] }


export type DataShapeType<D extends (...args: any) => any> = D extends DataClass<infer S, any> ? S : never;
export type DataInstanceType<D extends (...args: any) => any> = D extends DataClass<any, infer I> ? I : never;