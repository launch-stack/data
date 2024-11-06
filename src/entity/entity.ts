import {DataClass, DataInstanceType, DataShapeType} from "../types";
import {mixin} from "../mixin/mixin";
import {Pretty, ZodObjectTypes} from "../type-utils";
import {z} from "zod";
import {Copiable, data} from "../data";

export type EntityData = {
    id: string,
    createdAt?: Date,
    updatedAt?: Date,
}

export const IdSchema = z.string().min(1)

export const DatesSchema = z.object({
    createdAt: z.coerce.date().catch(() => new Date()),
    updatedAt: z.coerce.date().catch(() => new Date()),
})

export type Entity = {
    id: string,
    createdAt: Date,
    updatedAt: Date,
}



export function entityMixin<
    B extends DataClass<any, any>,
    C extends Copiable<DataShapeType<B> & {id:string}, InstanceType>,
    DataType = DataShapeType<B> & EntityData,
    InstanceType = DataInstanceType<B> & Entity & C,
>(Base: B): DataClass<DataType, InstanceType> {
    return mixin(Base, (base) => {
        function EntityConstructor(input: DataType & EntityData): InstanceType & Entity {
            const create = (data: any) => {
                const {createdAt, updatedAt} = data
                const id = IdSchema.parse(data.id)

                const d = DatesSchema.parse({
                    createdAt,
                    updatedAt
                })
                const instance = base(data)
                Object.assign(instance, {
                    id,
                    createdAt: d.createdAt,
                    updatedAt: d.updatedAt,
                })
                Object.assign(instance, {
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
                return instance
            }
            const instance = create(input)

            return instance as InstanceType & Entity;
        }

        (EntityConstructor as any).schema = Base.schema;
        (EntityConstructor as any).parse = EntityConstructor;
        return EntityConstructor as any;
    });
}


export function entity<
    T extends ZodObjectTypes,
    M extends { [key: string]: (this: InstanceType, ...args: any[]) => any },
    C extends Copiable<z.infer<T> & BaseDataType & { id: string }, InstanceType>,
    B extends DataClass<any, any> | null = null,
    BaseInstanceType = B extends DataClass<any, infer U> ? U : {},
    BaseDataType = B extends DataClass<infer U, any> ? U : {},
    SchemaType = Pretty<z.infer<T> & BaseDataType & EntityData>,
    InstanceType = Pretty<BaseInstanceType & SchemaType & M & Entity & C>
>(options: {
    schema: T,
    methods: M,
    base?: B
}): DataClass<SchemaType, InstanceType> {
    return entityMixin(data(options))
}




