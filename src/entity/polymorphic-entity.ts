import {z} from "zod";
import {Pretty} from "../type-utils";
import {polymorphicData} from "../polymorphic/polymorphic-data";
import {Entity, EntityData, IdSchema} from "./entity";
import {DataClass, PolymorphicDataClass} from "../types";
import {mixin} from "../mixin/mixin";
import {Copiable} from "../data";
import {an} from "vitest/dist/chunks/reporters.anwo7Y6a";

export type PolymorphicEntityClass<
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
            Pretty<BaseSchemaType & z.infer<VariantSchemas[K]> & { id: string }>,
            Pretty<BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K } & Entity>
        >
    },
> =
    & DataClass<SchemaType & EntityData, InstanceType & Entity>
    & { [K in keyof VariantSchemas]: (data: BaseSchemaType & z.infer<VariantSchemas[K]> & EntityData) => Pretty<C[K] & BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & Entity & { [T in Discriminator]: K }> }


export function polymorphicEntityMixin<
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
            Pretty<BaseSchemaType & z.infer<VariantSchemas[K]> & { id: string }>,
            Pretty<BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K }>
        >
    },
    C2 extends {
        [K in keyof VariantSchemas]: Copiable<
            Pretty<BaseSchemaType & z.infer<VariantSchemas[K]> & { id: string }>,
            Pretty<BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K } & Entity>
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
>(Base: PolymorphicDataClass<
    Discriminator,
    SchemaType,
    InstanceType,
    BaseSchemaType,
    BaseInstanceType,
    VariantSchemas,
    VariantMethods,
    C
>): PolymorphicEntityClass<Discriminator,
    SchemaType,
    InstanceType,
    BaseSchemaType,
    BaseInstanceType,
    VariantSchemas,
    VariantMethods,
    C2
> {
    return mixin(Base, (base) => {
        const attach = (instance: any, data: any) => {
            const id = IdSchema.parse(data.id)
            return Object.assign(instance, {
                id,
                createdAt: data.createdAt ?? data.updatedAt ?? new Date(),
                updatedAt: data.updatedAt ?? new Date()
            })
        }

        const variantConstructors = base.variants.reduce((acc, key) => {
            return {
                ...acc,
                [key]: VariantConstructor
            }

            function VariantConstructor(input: any) {
                const create = (data: any) => {
                    const instance = base[key](data)
                    attach(instance, data)
                    Object.assign(instance as any, {
                        copy(partial: any) {
                            const {updatedAt, createdAt, ...rest} = partial
                            const updated = {
                                ...instance,
                                ...rest,
                                updatedAt: new Date()
                            }
                            return create(updated)
                        }
                    })
                    return instance as InstanceType;
                }
                return create(input)
            }
        }, {})


        function EntityConstructor(input: SchemaType & EntityData): InstanceType & Entity {
            const create = (data: any) => {
                const {id, createdAt, updatedAt, ...rest} = data
                const instance = base(rest as SchemaType)
                attach(instance, data)
                Object.assign(instance as any, {
                    copy(partial: any) {
                        const {updatedAt, createdAt, ...rest} = partial
                        const updated = {
                            ...instance,
                            ...rest,
                            updatedAt: new Date()
                        }
                        return create(updated)
                    }
                })
                return instance as (InstanceType & Entity)
            }

            return create(input)
        }

        (EntityConstructor as any).schema = base.schema;
        Object.assign(EntityConstructor, variantConstructors);

        return EntityConstructor as PolymorphicEntityClass<Discriminator,
            SchemaType,
            InstanceType,
            BaseSchemaType,
            BaseInstanceType,
            VariantSchemas,
            VariantMethods,
            C2
        >;
    });
}


export function polymorphicEntity<
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
            Pretty<BaseSchemaType & z.infer<VariantSchemas[K]> & { id: string }>,
            Pretty<BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K } & Entity>
        >
    },
    BaseSchemaType = z.infer<BaseSchema>,
    BaseInstanceType = BaseSchemaType & BaseMethod,
    SchemaType = Pretty<BaseSchemaType & EntityData & {
        [K in keyof VariantSchemas]: z.infer<VariantSchemas[K]> & { [T in Discriminator]: K }
    }[keyof VariantSchemas]>,
    InstanceType = Pretty<{
        [K in keyof VariantSchemas]: Pretty<C[K] & BaseInstanceType & z.infer<VariantSchemas[K]> & VariantMethods[K] & { [T in Discriminator]: K }>;
    }[keyof VariantSchemas] & Entity>,
>(
    options: {
        discriminator: Discriminator,
        schemas: VariantSchemas,
        methods: VariantMethods,
        baseSchema: BaseSchema,
        baseMethods: BaseMethod,
    }
): PolymorphicEntityClass<Discriminator,
    SchemaType,
    InstanceType,
    BaseSchemaType,
    BaseInstanceType,
    VariantSchemas,
    VariantMethods,
    C
> {
    return polymorphicEntityMixin(
        polymorphicData<Discriminator, BaseSchema, BaseMethod, VariantSchemas, VariantMethods, C, BaseSchemaType, BaseInstanceType, SchemaType, InstanceType>(options)
    )
}