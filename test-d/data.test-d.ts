import { z } from "zod";
import { expectNotType, expectType } from "tsd";
import { DataInstanceType, data } from "../src";

const User = data({
    schema: z.object({
        name: z.string(),
        age: z.number(),
    }),
    methods: {
        greet() {
            console.log(`Hello, my name is ${this.name}`);
        },
        isAdult() {
            return this.age >= 18;
        },
    },
});

type UserType = DataInstanceType<typeof User>;

type ExpectedUser = {
    name: string;
    age: number;
    greet(this: { name: string; age: number }): void;
    isAdult(this: { name: string; age: number }): boolean;
};

const validUser = User({
    name: "Alice",
    age: 25,
});

expectType<UserType>(validUser);
expectType<ExpectedUser>(validUser);
expectNotType<{ name: string; age: number; }>(validUser); // Missing methods

expectType<void>(validUser.greet());
expectType<boolean>(validUser.isAdult());


const edgeCaseUser = User({
    name: "",
    age: 0,
});

expectType<UserType>(edgeCaseUser);
expectType<string>(edgeCaseUser.name);
expectType<number>(edgeCaseUser.age);
expectType<void>(edgeCaseUser.greet());
expectType<boolean>(edgeCaseUser.isAdult());

// Large numbers and special characters
const specialUser = User({
    name: "Élodie 🚀",
    age: 1000000,
});

expectType<UserType>(specialUser);
expectType<string>(specialUser.name);
expectType<number>(specialUser.age);
expectType<void>(specialUser.greet());
expectType<boolean>(specialUser.isAdult());


// Ensure methods are not available on plain objects
expectNotType<() => void>(({} as any).greet);
expectNotType<() => boolean>(({} as any).isAdult);
