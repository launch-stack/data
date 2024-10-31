import {data} from "./data";
import {z} from "zod";
import {polymorphicData} from "./polymorphic/polymorphic-data";

const Person = data({
    schema: z.object({
        firstName: z.string().min(0),
        lastName: z.string().min(0),
        birthDate: z.date(),
    }),
    methods: {
        fullName() {
            return `${this.firstName} ${this.lastName}`
        },
        age() {
            return new Date().getFullYear() - this.birthDate.getFullYear()
        }
    },
})


const Employee = data({
    base: Person,
    schema: z.object({
        employeeId: z.string(),
        department: z.string(),
    }),
    methods: {
        isManager() {
            return this.department === 'Management'
        },
        isRetired() {
            return this.age() > 65
        }
    }
})


const Order = polymorphicData({
    discriminator: 'status',
    baseSchema: z.object({
        products: z.array(z.object({
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
        })),
        orderDate: z.date(),
    }),
    baseMethods: {
        totalPrice() {
            return this.products.reduce((total, product) => total + product.price * product.quantity, 0)
        }
    },
    schemas: {
        pending: z.object({
            estimatedDelivery: z.date(),
        }),
        delivered: z.object({
            deliveredAt: z.date(),
        }),
        cancelled: z.object({
            reason: z.string(),
            cancelledAt: z.date(),
        })
    },
    methods: {
        pending: {
            markAsDelivered() {
                return Order.delivered({...this, deliveredAt: new Date()})
            },
            cancel(reason: string) {
                return Order.cancelled({...this, reason, cancelledAt: new Date()})
            }
        },
        delivered: {
            deliveryDuration() {
                return this.deliveredAt.getTime() - this.orderDate.getTime()
            }
        },
        cancelled: {
            retry() {
                return Order.pending({...this, estimatedDelivery: new Date()})
            }
        }
    }
})