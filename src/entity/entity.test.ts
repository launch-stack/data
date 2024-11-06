import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {entity} from './entity';

const User = entity({
    schema: z.object({
        name: z.string(),
    }),
    methods: {
        greet() {
            return `Hello, my id is ${this.id}`;
        },
    },
});

const Admin = entity({
    schema: z.object({
        role: z.string(),
    }),
    methods: {
        hasRole(permission: string) {
            return this.role === permission;
        },
    },
    base: User,
})

describe('Entity Mixin Tests', () => {
    describe('User entity tests', () => {
        it('should create an entity with base properties and entity properties', () => {

            const user = User({
                id: 'user-123',
                name: 'Alice',
            });

            // Check base properties
            expect(user.id).toBe('user-123');
            expect(user.name).toBe('Alice');

            // Check entity properties
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        it('should assign createdAt and updatedAt automatically', () => {
            const userData = {
                id: 'user-456',
                name: 'Bob',
            };

            const beforeCreation = new Date();
            const user = User(userData);
            const afterCreation = new Date();

            expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
            expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

            expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
            expect(user.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
        });

        it('should execute base methods correctly', () => {
            const userData = {
                id: 'user-789',
                name: 'Charlie',
            };

            const user = User(userData);

            const greeting = user.greet();
            expect(greeting).toBe('Hello, my id is user-789');
        });

        it('should work with dates provided', () => {

            const user = User({
                id: 'user-101',
                name: 'Diana',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                updatedAt: new Date('2023-01-02T00:00:00Z'),
            });

            expect(user.id).toBe('user-101');
            expect(user.name).toBe('Diana');
            expect(user.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
            expect(user.updatedAt).toEqual(new Date('2023-01-02T00:00:00Z'));
        });

        it('should work with dates provided as string', () => {

            const user = User({
                id: 'user-101',
                name: 'Diana',
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-02T00:00:00Z',
            } as any);

            expect(user.id).toBe('user-101');
            expect(user.name).toBe('Diana');
            expect(user.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
            expect(user.updatedAt).toEqual(new Date('2023-01-02T00:00:00Z'));
        });

        it('should throw a validation error when required fields are missing', () => {
            const invalidData = {
                id: 'user-102',
            };

            expect(() => User(invalidData as any)).toThrowError(z.ZodError);
        });

        it('should throw a validation error when fields have incorrect types', () => {
            const invalidData = {
                id: 'user-103',
                name: 123,
            };

            expect(() => User(invalidData as any)).toThrowError(z.ZodError);
        });


        it('should ensure each entity instance has its own prototype', () => {
            const userData1 = {
                id: 'user-105',
                name: 'Frank',
            };

            const userData2 = {
                id: 'user-106',
                name: 'Grace',
            };

            const user1 = User(userData1);
            const user2 = User(userData2);

            expect(Object.getPrototypeOf(user1)).toBe(Object.getPrototypeOf(user2));

            user1.name = 'Franklin';
            expect(user2.name).toBe('Grace');
        });

        const wait = (timeout: number) => new Promise(res => setTimeout(res, timeout))
        it("copy should work properly", async () => {
            const user = User({
                id: 'user-101',
                name: 'Diana',
            })


            await wait(10)
            const normalCopy = user.copy({
                name: 'new name',
            })

            expect(normalCopy.id).toBe(user.id)
            expect(normalCopy.name).toBe('new name')
            expect(normalCopy.createdAt).toEqual(user.createdAt)
            expect(normalCopy.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime())
            expect(normalCopy.greet()).toBe('Hello, my id is user-101')


            await wait(10)
            const secondCopy = normalCopy.copy({
                id: '2',
                name: 'n',
            })

            expect(secondCopy.id).toBe('2')
            expect(secondCopy.name).toBe('n')
            expect(secondCopy.createdAt).toEqual(user.createdAt)
            expect(secondCopy.updatedAt.getTime()).toBeGreaterThan(normalCopy.updatedAt.getTime())
            expect(secondCopy.greet()).toBe('Hello, my id is 2')

        })
    })
    describe('Admin entity tests', () => {

        it('should create an admin entity with base properties and entity properties', () => {
            const admin = Admin({
                id: 'admin-123',
                name: 'Alice',
                role: 'admin',
            });

            // Check base properties
            expect(admin.id).toBe('admin-123');
            expect(admin.name).toBe('Alice');
            expect(admin.role).toBe('admin');

            // Check entity properties
            expect(admin.createdAt).toBeInstanceOf(Date);
            expect(admin.updatedAt).toBeInstanceOf(Date);
        })

        it('should execute base methods correctly', () => {
            const admin = Admin({
                id: 'admin-789',
                name: 'Charlie',
                role: 'admin',
            });

            const greeting = admin.greet();
            expect(greeting).toBe('Hello, my id is admin-789');
        });

        it('should execute entity methods correctly', () => {
            const admin = Admin({
                id: 'admin-789',
                name: 'Charlie',
                role: 'admin',
            });

            const hasRole = admin.hasRole('admin');
            expect(hasRole).toBe(true);
        });

        it('should use the from method to create an entity instance', () => {
            const admin = Admin({
                id: 'admin-101',
                name: 'Diana',
                role: 'admin',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                updatedAt: new Date('2023-01-02T00:00:00Z'),
            });

            expect(admin.id).toBe('admin-101');
            expect(admin.name).toBe('Diana');
            expect(admin.role).toBe('admin');
            expect(admin.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
            expect(admin.updatedAt).toEqual(new Date('2023-01-02T00:00:00Z'));
        });

        it('should throw a validation error when required fields are missing', () => {
            const invalidData = {
                id: 'admin-102',
            };

            expect(() => Admin(invalidData as any)).toThrowError(z.ZodError);
        });

        it('should throw a validation error when fields have incorrect types', () => {
            const invalidData = {
                id: 'admin-103',
                name: 123,
                role: 123,
            };

            expect(() => Admin(invalidData as any)).toThrowError(z.ZodError);
        });

        it('should ensure each entity instance has its own prototype', () => {
            const adminData1 = {
                id: 'admin-105',
                name: 'Frank',
                role: 'admin',
            };

            const adminData2 = {
                id: 'admin-106',
                name: 'Grace',
                role: 'admin',
            };

            const admin1 = Admin(adminData1);
            const admin2 = Admin(adminData2);

            expect(Object.getPrototypeOf(admin1)).toBe(Object.getPrototypeOf(admin2));

            admin1.name = 'Franklin';
            expect(admin2.name).toBe('Grace');
        })

    })
});