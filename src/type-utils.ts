import {z} from "zod";

export type Pretty<T> = { [K in keyof T]: T[K] };

export type ZodObjectTypes = z.ZodObject<any> | z.ZodEffects<z.ZodObject<any>>;
