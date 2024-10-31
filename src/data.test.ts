import {describe, expect, expectTypeOf, it} from "vitest";
import {data} from "./data";
import {z} from "zod";


const SampleData = data({
    schema: z.object({
        prop1: z.string(),
        prop2: z.number(),
        prop3: z.date(),
        prop4: z.boolean(),
        prop5: z.number().array(),
    }).refine(data => data.prop2 < data.prop5.length),
    methods: {
        sampleMethod() {
            return this.prop2 * 10
        },
    },
})


const SampleWithBase = data({
    schema: z.object({
        prop6: z.object({
            a: z.string(),
            b: z.string(),
        })
    }),
    methods: {
        sampleMethod2() {
            return this.prop6.a
        }
    },
    base: SampleData,
})


describe("data", () => {
    function validateSampleDataInstance(instance: any) {
        expect(instance).toBeDefined()


        expectTypeOf<{
            prop1: string,
            prop2: number,
            prop3: Date,
            prop4: boolean,
            prop5: number[],
        }>(instance)

        expect(instance.prop1).toBe('string')
        expect(instance.prop2).toBe(2)
        expect(instance.prop3).toBeInstanceOf(Date)
        expect(instance.prop4).toBe(true)
        expect(instance.prop5).toEqual([1, 2, 3])
    }

    describe("SampleData", () => {
        it("core functionality should work properly", () => {
            const SampleInstance = SampleData({
                prop1: 'string',
                prop2: 2,
                prop3: new Date(),
                prop4: true,
                prop5: [1, 2, 3]
            })
            validateSampleDataInstance(SampleInstance)
        })

        it("should throw error if invalid data is passed", () => {
            expect(() => SampleData({
                prop1: 'string',
                prop2: 2,
                prop3: new Date(),
                // @ts-ignore
                prop4: "",
                prop5: [1, 2, 3]
            })).toThrowError()
        })

        it("should throw error if invalid data is passed case 2", () => {
            expect(() => SampleData({
                prop1: 'string',
                prop2: 4,
                prop3: new Date(),
                prop4: false,
                prop5: [1, 2, 3]
            })).toThrowError()
        })

        it("should have methods attached to instance", () => {
            const SampleInstance = SampleData({
                prop1: 'string',
                prop2: 2,
                prop3: new Date(),
                prop4: true,
                prop5: [1, 2, 3]
            })

            expect(SampleInstance.sampleMethod()).toBe(20)
        })

        it("should have schema attached to constructor", () => {
            expect(SampleData.schema).toBeDefined()
        })


        it("copy should work properly", () => {
            const SampleInstance = SampleData({
                prop1: 'string',
                prop2: 2,
                prop3: new Date(),
                prop4: true,
                prop5: [1, 2, 3]
            })
            const firstCopy = SampleInstance.copy({prop1: 'new string'})
            expect(firstCopy).toEqual(expect.objectContaining({
                prop1: 'new string',
                prop2: 2,
                prop3: expect.any(Date),
                prop4: true,
                prop5: [1, 2, 3]
            }))

            expect(firstCopy.sampleMethod()).toBe(20)
            expect(firstCopy.copy).toBeDefined()
            const secondCopy = firstCopy.copy({prop2: 1})

            expect(secondCopy).toEqual(expect.objectContaining({
                prop1: 'new string',
                prop2: 1,
                prop3: expect.any(Date),
                prop4: true,
                prop5: [1, 2, 3]
            }))

        })
    })

    describe("SampleWithBase", () => {
        it("should have all properties", () => {
            const instance = SampleWithBase({
                prop1: 'string',
                prop2: 2,
                prop3: new Date(),
                prop4: true,
                prop5: [1, 2, 3],
                prop6: {
                    a: "a",
                    b: "b"
                }
            })
            validateSampleDataInstance(instance)
            expect(instance.prop6).toEqual({a: "a", b: "b"})
        })
        it("should have all methods", () => {
            const instance = SampleWithBase({
                prop1: 'string',
                prop2: 2,
                prop3: new Date(),
                prop4: true,
                prop5: [1, 2, 3],
                prop6: {
                    a: "a",
                    b: "b"
                }
            })
            expectTypeOf(instance).toHaveProperty("sampleMethod").toBeFunction()
            expectTypeOf(instance).toHaveProperty("sampleMethod2").toBeFunction()

            expect(instance.sampleMethod()).toBe(20);
            expect(instance.sampleMethod2()).toBe('a');
        })
        it("copy should work properly", () => {
            const instance = SampleWithBase({
                prop1: 'string',
                prop2: 2,
                prop3: new Date(),
                prop4: true,
                prop5: [1, 2, 3],
                prop6: {
                    a: "a",
                    b: "b"
                }
            })
            const firstCopy = instance.copy({prop1: 'new string'})
            expect(firstCopy).toEqual(expect.objectContaining({
                prop1: 'new string',
                prop2: 2,
                prop3: expect.any(Date),
                prop4: true,
                prop5: [1, 2, 3],
                prop6: {
                    a: "a",
                    b: "b"
                }
            }));

            expect(firstCopy.sampleMethod()).toBe(20)
            expect(firstCopy.sampleMethod2()).toBe('a')
            expect(firstCopy.copy).toBeDefined()
            const secondCopy = firstCopy.copy({
                prop2: 1
            })

            expect(secondCopy).toEqual(expect.objectContaining({
                prop1: 'new string',
                prop2: 1,
                prop3: expect.any(Date),
                prop4: true,
                prop5: [1, 2, 3],
                prop6: {
                    a: "a",
                    b: "b"
                }
            }));
        })
    })
})