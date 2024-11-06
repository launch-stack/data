import {z} from 'zod';
import {PolymorphicDataClass} from "../types";
import {Pretty} from "../type-utils";
import {Copiable} from "../data";


export function polymorphicData<
    Discriminator extends string,
    BaseSchema extends z.ZodObject<any>,
    BaseMethod extends { [key: string]: (this: BaseInstanceType, ...args: any[]) => any },
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
    BaseSchemaType = z.infer<BaseSchema>,
    BaseInstanceType = BaseSchemaType & BaseMethod,
    SchemaType = BaseSchemaType & {
        [K in keyof VariantSchemas]: z.infer<VariantSchemas[K]> & { [T in Discriminator]: K }
    }[keyof VariantSchemas],
    InstanceType = {
        [K in keyof VariantSchemas]: Pretty<C[K] & BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K }>;
    }[keyof VariantSchemas],
>(
    options: {
        discriminator: Discriminator,
        schemas: VariantSchemas,
        methods: VariantMethods,
        baseSchema: BaseSchema,
        baseMethods: BaseMethod,
    }
): PolymorphicDataClass<
    Discriminator,
    SchemaType,
    InstanceType,
    BaseSchemaType,
    BaseInstanceType,
    VariantSchemas,
    VariantMethods,
    C
> {
    const schema = z.discriminatedUnion<Discriminator, any>(
        options.discriminator,
        Object.entries(options.schemas).map(([key, variant]) => {
            return z.object({
                [options.discriminator]: z.literal(key),
                ...options.baseSchema.shape,
                ...variant.shape,
            })
        })
    )

    const variantConstructors = Object.entries(options.schemas).reduce((acc, [key, variant]) => {
        return {
            ...acc,
            [key]: VariantConstructor
        }

        function VariantConstructor(input: BaseSchemaType & z.infer<typeof variant>) {
            const create=(data:any)=>{
                const parsed = schema.parse({
                    [options.discriminator]: key,
                    ...data
                });
                const instance = Object.create(VariantConstructor.prototype);

                Object.assign(instance, options.baseMethods);

                const variantMethods = options.methods[key as keyof VariantSchemas];

                Object.assign(instance, variantMethods);

                Object.assign(instance, parsed);
                Object.assign(instance, {
                    copy(partial: any) {
                        const updated = {
                            ...data,
                            ...partial,
                        }
                        return create(updated)
                    }
                })
                return instance as InstanceType;
            }

            return create(input)
        }
    }, {})


    function DataConstructor(input: SchemaType): InstanceType {
        const create=(data:any)=>{
            const parsed = schema.parse(data);
            const instance = Object.create(DataConstructor.prototype);
            Object.assign(instance, options.baseMethods);
            const variantMethods = options.methods[parsed[options.discriminator] as keyof VariantSchemas];
            Object.assign(instance, variantMethods);
            Object.assign(instance, parsed);
            Object.assign(instance, {
                copy(partial: any) {
                    const updated = {
                        ...data,
                        ...partial,
                    }
                    return create(updated)
                }
            })
            return instance as InstanceType;
        }

        return create(input)
    }

    (DataConstructor as any).schema = schema;
    (DataConstructor as any).variants = Object.keys(options.schemas);
    (DataConstructor as any).parse = DataConstructor;
    Object.assign(DataConstructor, variantConstructors);

    return DataConstructor as PolymorphicDataClass<
        Discriminator,
        SchemaType,
        InstanceType,
        BaseSchemaType,
        BaseInstanceType,
        VariantSchemas,
        VariantMethods,
        C
    >
}