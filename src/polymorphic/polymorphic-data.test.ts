import {beforeEach, describe, expect, expectTypeOf, it, vi} from "vitest";
import {polymorphicData} from "./polymorphic-data";
import {z} from "zod";

export const PolyData = polymorphicData({
    discriminator: "status",
    baseSchema: z.object({
        userId: z.string(),
    }),
    baseMethods: {
        notify() {
            console.log(`Notifying user ${this.userId}`);
        },
    },
    schemas: {
        pending: z.object({
            orderedAt: z.date(),
            pendingReason: z.string(),
        }),
        shipped: z.object({
            shippedAt: z.date(),
        }),
    },
    methods: {
        pending: {
            refresh(time: number) {
                return this.orderedAt.getTime() + time;
            },
        },
        shipped: {
            track() {
                return this.shippedAt
            },
        },
    },
});

describe("PolymorphicData", () => {
    let currentDate: Date;

    beforeEach(() => {
        currentDate = new Date();
    });

    describe("Instance Creation", () => {
        it("should create a pending instance with correct properties and methods", () => {
            const pendingData = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });

            // Runtime Assertions
            expect(pendingData).toBeInstanceOf(Object);
            expect(pendingData.userId).toBe("user123");
            expect(pendingData.status).toBe("pending");
            expect(pendingData.orderedAt).toBeInstanceOf(Date);
            expect(pendingData.orderedAt).toEqual(currentDate);
            expect(pendingData.pendingReason).toBe("Awaiting stock");
            expect((pendingData as any).track).toBeUndefined();
            expect((pendingData as any).shippedAt).toBeUndefined();

            // Type Assertions
            expectTypeOf(pendingData.userId).toBeString();
            expectTypeOf(pendingData.status).toEqualTypeOf<"pending">();
            expectTypeOf(pendingData.pendingReason).toBeString();
            expectTypeOf(pendingData.notify).toBeFunction();
            expectTypeOf(pendingData.refresh).toBeFunction();
        });

        it("should create a shipped instance with correct properties and methods", () => {
            const shippedData = PolyData.shipped({
                userId: "user456",
                shippedAt: currentDate,
            });

            // Runtime Assertions
            expect(shippedData).toBeInstanceOf(Object);
            expect(shippedData.userId).toBe("user456");
            expect(shippedData.status).toBe("shipped");
            expect(shippedData.shippedAt).toBeInstanceOf(Date);
            expect(shippedData.shippedAt).toEqual(currentDate);
            expect((shippedData as any).refresh).toBeUndefined();
            expect((shippedData as any).orderedAt).toBeUndefined();

            // Type Assertions
            expectTypeOf(shippedData.userId).toBeString();
            expectTypeOf(shippedData.status).toEqualTypeOf<"shipped">();
            expectTypeOf(shippedData.notify).toBeFunction();
            expectTypeOf(shippedData.track).toBeFunction();
        });

        it("should create a generic data instance when using the base constructor", () => {
            const genericData = PolyData({
                userId: "user789",
                status: "pending",
                orderedAt: currentDate,
                pendingReason: "Awaiting shipment",
            });

            if(genericData.status=='pending'){
                genericData.copy({
                    orderedAt: new Date(),
                    userId:"",
                    pendingReason: ""
                })
            }


            // Runtime Assertions
            expect(genericData).toBeInstanceOf(Object);
            expect(genericData.userId).toBe("user789");
            expect(genericData.status).toBe("pending");
            expect((genericData as any).orderedAt).toBeInstanceOf(Date);
            expect((genericData as any).orderedAt).toEqual(currentDate);
            expect((genericData as any).pendingReason).toBe("Awaiting shipment");
            expect((genericData as any).track).toBeUndefined();
            expect((genericData as any).shippedAt).toBeUndefined();
            // Type Assertions
            expectTypeOf(genericData.userId).toBeString();
            expectTypeOf(genericData.notify).toBeFunction();
        });
    });

    describe("Method Functionality", () => {
        it("should execute the notify method correctly", () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
            });
            const pendingData = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });

            pendingData.notify();
            expect(consoleSpy).toHaveBeenCalledWith("Notifying user user123");

            consoleSpy.mockRestore();
        });

        it("should execute the refresh method correctly for pending data", () => {
            const pendingData = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });

            const additionalTime = 3600000; // 1 hour in milliseconds
            const newTimestamp = pendingData.refresh(additionalTime);

            expect(newTimestamp).toBe(currentDate.getTime() + additionalTime);
        });


    });

    describe("Validation and Type Safety", () => {
        it("should throw an error when creating a pending instance with invalid data", () => {
            expect(() =>
                PolyData.pending({
                    userId: "user123",
                    orderedAt: "not-a-date" as any, // Invalid date
                    pendingReason: "Awaiting stock",
                })
            ).toThrowError();
        });

        it("should throw an error when creating a shipped instance with missing shippedAt", () => {
            expect(() =>
                PolyData.shipped({
                    userId: "user456",
                    // Missing shippedAt
                } as any)
            ).toThrowError();
        });

        it("should throw an error when discriminator field is invalid", () => {
            expect(() =>
                PolyData({
                    userId: "user789",
                    status: "unknown" as any,
                    orderedAt: currentDate,
                    pendingReason: "Awaiting shipment",
                })
            ).toThrowError();
        });
    });

    describe("Polymorphic Behavior", () => {
        it("should handle multiple variants correctly", () => {
            const pendingData = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });

            const shippedData = PolyData.shipped({
                userId: "user456",
                shippedAt: currentDate,
            });

            expect(pendingData.status).toBe("pending");
            expect(shippedData.status).toBe("shipped");
        });

        it("should maintain type safety across variants", () => {
            const pendingData = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });

            const shippedData = PolyData.shipped({
                userId: "user456",
                shippedAt: currentDate,
            });

            // Type Assertions
            expectTypeOf(pendingData).toHaveProperty("notify").toBeFunction();
            expectTypeOf(pendingData).toHaveProperty("refresh").toBeFunction();
            expectTypeOf(pendingData).not.toHaveProperty("track");

            expectTypeOf(shippedData).toHaveProperty("notify").toBeFunction();
            expectTypeOf(shippedData).toHaveProperty("track").toBeFunction();
            expectTypeOf(shippedData).not.toHaveProperty("refresh");

            // TypeScript should infer the correct types
            pendingData.notify();
            pendingData.refresh(1000);

            shippedData.notify();
            shippedData.track();

            // Uncommenting the following lines should cause TypeScript errors
            // pendingData.track();
            // shippedData.refresh();
        });
    });

    describe("Copy",()=>{
        it("should copy correctly",()=> {
            const pendingData = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });


            const copy = pendingData.copy({
                pendingReason: "New Reason"
            })

            expect(copy.orderedAt).not.toBe(currentDate)
            expect(copy.pendingReason).toBe("New Reason")

            expect(copy.refresh(100)).toBe(currentDate.getTime()+100)

            const copyOrderedAt=new Date()
            const secondCopy = copy.copy({
                userId:"usercopy",
                orderedAt:copyOrderedAt
            })

            expect(secondCopy.userId).toBe("usercopy")
            expect(secondCopy.pendingReason).toBe("New Reason")
            expect(secondCopy.refresh(100)).toBe(copyOrderedAt.getTime()+100)

        })
    })
    describe("Edge Cases", () => {
        it("should handle empty strings and zero values correctly", () => {
            const pendingData = PolyData.pending({
                userId: "",
                orderedAt: new Date(0),
                pendingReason: "",
            });

            expect(pendingData.userId).toBe("");
            expect(pendingData.orderedAt).toEqual(new Date(0));
            expect(pendingData.pendingReason).toBe("");
            expect(pendingData.refresh(0)).toBe(new Date(0).getTime());
        });


        it("should handle multiple polymorphic instances simultaneously", () => {
            const pendingData1 = PolyData.pending({
                userId: "user1",
                orderedAt: currentDate,
                pendingReason: "Reason 1",
            });

            const pendingData2 = PolyData.pending({
                userId: "user2",
                orderedAt: currentDate,
                pendingReason: "Reason 2",
            });

            const shippedData1 = PolyData.shipped({
                userId: "user3",
                shippedAt: currentDate,
            });

            const shippedData2 = PolyData.shipped({
                userId: "user4",
                shippedAt: currentDate,
            });

            expect(pendingData1.status).toBe("pending");
            expect(pendingData2.status).toBe("pending");
            expect(shippedData1.status).toBe("shipped");
            expect(shippedData2.status).toBe("shipped");
        });
    });

    describe("Type Safety with Vitest's expectTypeOf", () => {
        it("should infer the correct type for pending instances", () => {
            const pendingData = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });

            expectTypeOf(pendingData).toMatchTypeOf<{
                userId: string;
                status: "pending";
                orderedAt: Date;
                pendingReason: string;
                notify: () => void;
                refresh: (time: number) => number;
            }>();
        });

        it("should infer the correct type for shipped instances", () => {
            const shippedData = PolyData.shipped({
                userId: "user456",
                shippedAt: currentDate,
            });

            expectTypeOf(shippedData).toMatchTypeOf<{
                userId: string;
                status: "shipped";
                shippedAt: Date;
                notify: () => void;
                track: () => void;
            }>();
        });


        it("should enforce type safety in polymorphicData", () => {
            // Correct usage
            const validPending = PolyData.pending({
                userId: "user123",
                orderedAt: currentDate,
                pendingReason: "Awaiting stock",
            });

            const validShipped = PolyData.shipped({
                userId: "user456",
                shippedAt: currentDate,
            });

            // TypeScript should infer the correct types
            expectTypeOf(validPending).toHaveProperty("notify").toBeFunction();
            expectTypeOf(validPending).toHaveProperty("refresh").toBeFunction();
            expectTypeOf(validShipped).toHaveProperty("notify").toBeFunction();
            expectTypeOf(validShipped).toHaveProperty("track").toBeFunction();
        });
    });

});
