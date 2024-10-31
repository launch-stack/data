import {beforeEach, describe, expect, it} from "vitest";
import {polymorphicEntityMixin} from "./polymorphic-entity";
import {PolyData} from "../polymorphic/polymorphic-data.test";

const PolyEntity = polymorphicEntityMixin(PolyData)


describe("Polymorphic Entity", () => {
    let currentDate: Date;

    beforeEach(() => {
        currentDate = new Date();
    });

    function validatePending(entity: any) {
        expect(entity.id).toBe("entity-123");
        expect(entity.createdAt).toBeInstanceOf(Date);
        expect(entity.updatedAt).toBeInstanceOf(Date);
        expect(entity.userId).toBe("user");
        expect(entity.status).toBe("pending");
        expect((entity as any).orderedAt).toEqual(currentDate);
        expect((entity as any).pendingReason).toBe("reason");
        expect((entity as any).shippedAt).toBeUndefined();
        expect((entity as any).refresh(100)).toBe(currentDate.getTime() + 100);
        expect((entity as any).track).toBeUndefined();
    }

    function validateShipped(entity: any) {
        expect(entity.id).toBe("entity-123");
        expect(entity.createdAt).toBeInstanceOf(Date);
        expect(entity.updatedAt).toBeInstanceOf(Date);
        expect(entity.userId).toBe("user");
        expect(entity.status).toBe("shipped");
        expect((entity as any).shippedAt).toEqual(currentDate);
        expect((entity as any).pendingReason).toBeUndefined();
        expect((entity as any).orderedAt).toBeUndefined();
        expect((entity as any).track()).toEqual(currentDate);
        expect((entity as any).refresh).toBeUndefined();
    }

    it("should create a polymorphic entity with default constructor", () => {
        const entity = PolyEntity({
            id: "entity-123",
            userId: "user",
            orderedAt: currentDate,
            pendingReason: 'reason',
            status: 'pending',
        });

        validatePending(entity)
    });

    it("should create a polymorphic entity with variant constructor: pending", () => {
        const entity = PolyEntity.pending({
            id: "entity-123",
            userId: "user",
            orderedAt: currentDate,
            pendingReason: 'reason',
        });
        validatePending(entity)
    });

    it("should create a polymorphic entity with variant constructor: shipped", () => {
        const entity = PolyEntity.shipped({
            id: "entity-123",
            userId: "user",
            shippedAt: currentDate,
        });

        validateShipped(entity)
    });

    const wait = (timeout: number) => new Promise(res => setTimeout(res, timeout))
    it("should copy", async () => {
        const entity = PolyEntity.shipped({
            id: "entity-123",
            userId: "user",
            shippedAt: currentDate,
        });
        await wait(10)

        const copy = entity.copy({
            userId: '2',
            shippedAt: new Date()
        })

        expect(copy.id).toBe(entity.id)
        expect(copy.userId).toBe('2')
        expect(copy.shippedAt.getTime()).toBeGreaterThan(entity.shippedAt.getTime())
        expect(copy.createdAt).toEqual(entity.createdAt)
        expect(copy.updatedAt.getTime()).toBeGreaterThan(entity.updatedAt.getTime())
        expect(copy.notify).toBeDefined()
        expect(copy.track()).toEqual(copy.shippedAt)
        await wait(10)

        const secondCopy = copy.copy({
            id: '2',
        })

        expect(secondCopy.id).toBe('2')
        expect(secondCopy.userId).toBe('2')
        expect(secondCopy.shippedAt).toEqual(copy.shippedAt)
        expect(secondCopy.createdAt).toEqual(copy.createdAt)
        expect(secondCopy.updatedAt.getTime()).toBeGreaterThan(copy.updatedAt.getTime())
        expect(secondCopy.notify).toBeDefined()
        expect(secondCopy.track()).toEqual(secondCopy.shippedAt)
    })
})