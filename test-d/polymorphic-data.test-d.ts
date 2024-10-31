import { z } from "zod";
import { expectNotType, expectType } from "tsd";
import { DataInstanceType, polymorphicData } from "../src";

// Define the Polymorphic Data Model
const Sample1 = polymorphicData({
    discriminator: 'status',
    baseSchema: z.object({
        userId: z.string(),
    }),
    baseMethods: {
        notify() {
            return false;
        }
    },
    schemas: {
        pending: z.object({
            orderedAt: z.date(),
            pendingReason: z.string(),
        }),
        shipped: z.object({
            shippedAt: z.date(),
        }),
        canceled: z.object({
            canceledAt: z.date(),
            reason: z.string(),
        }),
    },
    methods: {
        pending: {
            refresh(time: number) {
                return this.orderedAt.getTime() + time;
            }
        },
        shipped: {
            track() {
                console.log(this.shippedAt);
            }
        },
        canceled: {
            refund(amount: number) {
                return `Refunded $${amount}`;
            }
        }
    },
});

type Sample1Type = DataInstanceType<typeof Sample1>;

type Pending = {
    userId: string;
    status: 'pending';
    orderedAt: Date;
    pendingReason: string;
    notify(this: { userId: string }): boolean;
    refresh(this: { userId: string; orderedAt: Date; pendingReason: string }, time: number): number;
};

type Shipped = {
    userId: string;
    status: 'shipped';
    shippedAt: Date;
    notify(this: { userId: string }): boolean;
    track(this: { userId: string; shippedAt: Date }): void;
};

type Canceled = {
    userId: string;
    status: 'canceled';
    canceledAt: Date;
    reason: string;
    notify(this: { userId: string }): boolean;
    refund(this: { userId: string; canceledAt: Date; reason: string }, amount: number): string;
};

// Instance Creation Tests
const Sample1Instance = Sample1({
    userId: "",
    status: "pending",
    orderedAt: new Date(),
    pendingReason: "",
});

expectType<Sample1Type>(Sample1Instance);
expectType<Pending | Shipped | Canceled>(Sample1Instance);

// Pending Instance Tests
const PendingInstance = Sample1.pending({
    userId: "",
    orderedAt: new Date(),
    pendingReason: "",
});

expectType<Pending>(PendingInstance);
expectNotType<Shipped>(PendingInstance);
expectNotType<Canceled>(PendingInstance);

// Shipped Instance Tests
const ShippedInstance = Sample1.shipped({
    userId: "",
    shippedAt: new Date(),
});

expectType<Shipped>(ShippedInstance);
expectNotType<Pending>(ShippedInstance);
expectNotType<Canceled>(ShippedInstance);

// Canceled Instance Tests
const CanceledInstance = Sample1.canceled({
    userId: "",
    canceledAt: new Date(),
    reason: "Out of stock",
});

expectType<Canceled>(CanceledInstance);
expectNotType<Pending>(CanceledInstance);
expectNotType<Shipped>(CanceledInstance);

// Method Return Type Tests
expectType<boolean>(Sample1Instance.notify());
expectType<number>(PendingInstance.refresh(1000));
expectType<void>(ShippedInstance.track());
expectType<string>(CanceledInstance.refund(50));