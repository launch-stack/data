# @launchstack/data Documentation

## Introduction

### What is @launchstack/data?

**@launchstack/data** is an open-source TypeScript library designed to simplify data modeling by combining the strengths of types, validation, and instance methods while minimizing boilerplate code. Part of the LaunchStack family of libraries, it aims to accelerate product development by providing a robust yet flexible foundation for defining complex data structures.

### Why @launchstack/data?

In TypeScript, developers have several options for modeling data:

1. **Interfaces/Types**: Provide compile-time type checking but lack runtime validation and cannot include methods directly.
2. **Classes**: Allow defining fields and attaching methods, but can be verbose and require additional boilerplate for validation and inheritance.
3. **Zod Schemas**: Offer runtime validation and type inference but do not support attaching instance methods natively.

**@launchstack/data** bridges these gaps by:

- **Combining Typing and Validation**: Built on top of Zod, it ensures that your data adheres to defined schemas both at compile-time and runtime.
- **Attaching Instance Methods**: Allows you to define helper methods directly on your data models for better encapsulation and discoverability.
- **Reducing Boilerplate**: Simplifies the process of creating complex data models, including polymorphic types and entities with shared properties.

### Key Features Overview

- **Unified Data Modeling**: Define schemas, types, and methods in a single, cohesive structure.
- **Runtime Validation**: Ensure data integrity with built-in validation using Zod schemas.
- **Instance Methods**: Attach methods directly to your data models for cleaner and more maintainable code.
- **Inheritance and Composition**: Reuse and extend existing models with ease.
- **Polymorphic Data Handling**: Model complex data structures with discriminated unions for different variants.
- **Entities with Mixins**: Add common properties like IDs and timestamps to your models using mixins.

---

## Installation & Setup

### Installation

You can install **@launchstack/data** using npm or yarn:

```bash
npm install @launchstack/data zod
```

Or with pnpm:

```bash
pnpm add @launchstack/data zod
```

> **Note:** Zod is a peer dependency and must be installed alongside @launchstack/data.

### Basic Setup

Here's a quick example to get you started:

```typescript
import { data } from '@launchstack/data';
import { z } from 'zod';

const Person = data({
  schema: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    birthDate: z.date(),
  }),
  methods: {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    },
    age() {
      return new Date().getFullYear() - this.birthDate.getFullYear();
    },
  },
});

// Usage
const person = Person({
  firstName: 'John',
  lastName: 'Doe',
  birthDate: new Date('1990-01-01'),
});

console.log(person.fullName()); // "John Doe"
console.log(person.age()); // e.g., 34
```

---

## Core Concepts

### Data Models

At the heart of **@launchstack/data** is the ability to define data models that combine:

- **Schema Definition**: Using Zod for data validation.
- **Type Inference**: Automatic TypeScript typing based on the schema.
- **Instance Methods**: Attaching methods directly to instances for better encapsulation.

#### Defining a Data Model

```typescript
const ModelName = data({
  schema: z.object({
    // Define your schema here
  }),
  methods: {
    // Define instance methods here
  },
});
```

**Example:**

```typescript
const User = data({
  schema: z.object({
    username: z.string().min(1),
    email: z.string().email(),
  }),
  methods: {
    greet() {
      return `Hello, ${this.username}!`;
    },
  },
});
```

#### Creating Instances

```typescript
const user = User({
  username: 'alice',
  email: 'alice@example.com',
});

console.log(user.greet()); // "Hello, alice!"
```

### Inheriting Models

You can extend existing models using the `base` property. This allows you to reuse schemas and methods from a base model.

**Example:**

```typescript
const Employee = data({
  base: User,
  schema: z.object({
    employeeId: z.string().min(1),
    department: z.string().min(1),
  }),
  methods: {
    isInDepartment(dept: string) {
      return this.department === dept;
    },
  },
});

const employee = Employee({
  username: 'bob',
  email: 'bob@example.com',
  employeeId: 'E123',
  department: 'Engineering',
});

console.log(employee.greet()); // "Hello, bob!"
console.log(employee.isInDepartment('Engineering')); // true
```

### Polymorphic Data Models

Polymorphic data models allow you to define data structures that can take on multiple forms (variants), each with its own schema and methods, differentiated by a discriminator field.

#### Defining a Polymorphic Model

```typescript
const ModelName = polymorphicData({
  discriminator: 'type',
  baseSchema: z.object({
    // Shared properties
  }),
  baseMethods: {
    // Shared methods
  },
  schemas: {
    variant1: z.object({
      // Variant 1 specific properties
    }),
    variant2: z.object({
      // Variant 2 specific properties
    }),
  },
  methods: {
    variant1: {
      // Methods for variant 1
    },
    variant2: {
      // Methods for variant 2
    },
  },
});
```

**Example:**

```typescript
const Order = polymorphicData({
  discriminator: 'status',
  baseSchema: z.object({
    items: z.array(z.string()),
    orderDate: z.date(),
  }),
  baseMethods: {
    totalItems() {
      return this.items.length;
    },
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
    }),
  },
  methods: {
    pending: {
      ship() {
        return Order.delivered({
          ...this,
          deliveredAt: new Date(),
        });
      },
    },
    delivered: {
      deliveryTime() {
        return this.deliveredAt.getTime() - this.orderDate.getTime();
      },
    },
    cancelled: {
      retry() {
        return Order.pending({
          ...this,
          estimatedDelivery: new Date(),
        });
      },
    },
  },
});
```

#### Creating Instances

```typescript
const pendingOrder = Order.pending({
  items: ['Item1', 'Item2'],
  orderDate: new Date('2023-10-01'),
  estimatedDelivery: new Date('2023-10-05'),
});

console.log(pendingOrder.totalItems()); // 2

const deliveredOrder = pendingOrder.ship();
console.log(deliveredOrder.status); // 'delivered'
```

### Mixin & Composition

Mixins allow you to compose models by adding common properties or methods without traditional inheritance. This is particularly useful for adding consistent behavior across multiple models.

#### Defining a Mixin

```typescript
function mixin<BaseModel>(Base: BaseModel, mixinFn: (base: BaseModel) => any) {
  return mixinFn(Base);
}
```

**Example:**

```typescript
const Timestamped = mixin(dataModel, (Base) => {
  return data({
    base: Base,
    schema: z.object({
      createdAt: z.date().default(() => new Date()),
      updatedAt: z.date().default(() => new Date()),
    }),
    methods: {
      touch() {
        this.updatedAt = new Date();
      },
    },
  });
});
```

---

## Advanced Modeling with Polymorphic Data

### Understanding the Discriminator

The `discriminator` is a field that determines which variant of the polymorphic model an instance represents. It must be a string that matches one of the keys in the `schemas` and `methods` objects.

**Example:**

```typescript
discriminator: 'status',
```

In the `Order` example, `status` can be `'pending'`, `'delivered'`, or `'cancelled'`.

### Base Schema and Methods

These are properties and methods shared across all variants.

**Base Schema:**

```typescript
baseSchema: z.object({
  items: z.array(z.string()),
  orderDate: z.date(),
}),
```

**Base Methods:**

```typescript
baseMethods: {
  totalItems() {
    return this.items.length;
  },
},
```

### Variant-Specific Schemas and Methods

Each variant has its own schema and methods, allowing you to define behavior unique to that variant.

**Variant Schemas:**

```typescript
schemas: {
  pending: z.object({
    estimatedDelivery: z.date(),
  }),
  delivered: z.object({
    deliveredAt: z.date(),
  }),
  cancelled: z.object({
    reason: z.string(),
  }),
},
```

**Variant Methods:**

```typescript
methods: {
  pending: {
    ship() {
      // Transition to delivered
    },
  },
  delivered: {
    deliveryTime() {
      // Calculate delivery duration
    },
  },
  cancelled: {
    retry() {
      // Transition back to pending
    },
  },
},
```

### Utility Methods in Polymorphic Models

#### Copy Functionality

The `copy` method allows you to create a new instance with modified properties, ensuring immutability.

**Example:**

```typescript
const newOrder = pendingOrder.copy({ estimatedDelivery: new Date('2023-10-06') });
```

---

## Entities and Mixin-Based Composition

### Defining Entities with Mixin

Entities are models that include common properties like `id`, `createdAt`, and `updatedAt`. Using mixins, you can easily add these properties to your models.

#### Entity Mixin

```typescript
function entityMixin<BaseModel>(Base: BaseModel) {
  return data({
    base: Base,
    schema: z.object({
      id: z.string().min(1),
      createdAt: z.date().default(() => new Date()),
      updatedAt: z.date().default(() => new Date()),
    }),
    methods: {
      touch() {
        this.updatedAt = new Date();
      },
    },
  });
}
```

#### Creating an Entity

```typescript
const User = entityMixin(
  data({
    schema: z.object({
      name: z.string(),
    }),
    methods: {
      greet() {
        return `Hello, my ID is ${this.id}`;
      },
    },
  })
);

// Usage
const user = User({
  id: 'user-1',
  name: 'Alice',
});

console.log(user.greet()); // "Hello, my ID is user-1"
```

### Entity Inheritance and Extending Models

You can extend entities just like regular models.

**Example:**

```typescript
const Admin = entityMixin(
  data({
    base: User,
    schema: z.object({
      role: z.string(),
    }),
    methods: {
      hasRole(role: string) {
        return this.role === role;
      },
    },
  })
);

// Usage
const admin = Admin({
  id: 'admin-1',
  name: 'Bob',
  role: 'superadmin',
});

console.log(admin.greet()); // "Hello, my ID is admin-1"
console.log(admin.hasRole('superadmin')); // true
```

### Polymorphic Entities

You can also create polymorphic entities using mixins, combining the power of polymorphic models with common entity properties.

**Example:**

```typescript
const Task = polymorphicEntity({
  discriminator: 'state',
  baseSchema: z.object({
    title: z.string(),
  }),
  baseMethods: {
    rename(newTitle: string) {
      return this.copy({ title: newTitle });
    },
  },
  schemas: {
    todo: z.object({}),
    inProgress: z.object({
      startedAt: z.date(),
    }),
    done: z.object({
      completedAt: z.date(),
    }),
  },
  methods: {
    todo: {
      start() {
        return Task.inProgress({
          ...this,
          startedAt: new Date(),
        });
      },
    },
    inProgress: {
      complete() {
        return Task.done({
          ...this,
          completedAt: new Date(),
        });
      },
    },
    done: {
      reopen() {
        return Task.todo({
          ...this,
        });
      },
    },
  },
});

// Usage
const task = Task.todo({
  id: 'task-1',
  title: 'Write documentation',
});

const inProgressTask = task.start();
console.log(inProgressTask.state); // 'inProgress'

const completedTask = inProgressTask.complete();
console.log(completedTask.state); // 'done'
```

---

## Built-in Utilities and Helper Functions

### Copy Functionality

The `copy` method is available on all instances, allowing you to create new instances with modified properties while keeping the original instance unchanged.

**Example:**

```typescript
const updatedUser = user.copy({ name: 'Charlie' });
console.log(updatedUser.name); // 'Charlie'
console.log(user.name); // 'Alice' (original remains unchanged)
```

### Mixin Use Cases

Mixins are powerful for adding common functionality across different models without repeating code.

**Common Use Cases:**

- **Timestamps**: Adding `createdAt` and `updatedAt` fields.
- **Identifiers**: Adding unique IDs to models.
- **Common Methods**: Attaching utility methods like `serialize`, `toJSON`, etc.

---

## Examples and Common Use Cases

### Building Reusable Models

Define base models that can be extended or composed into more specific models.

**Example:**

```typescript
const Animal = data({
  schema: z.object({
    species: z.string(),
  }),
  methods: {
    describe() {
      return `This is a ${this.species}.`;
    },
  },
});

const Dog = data({
  base: Animal,
  schema: z.object({
    breed: z.string(),
  }),
  methods: {
    bark() {
      return 'Woof!';
    },
  },
});

const myDog = Dog({
  species: 'Canine',
  breed: 'Labrador',
});

console.log(myDog.describe()); // "This is a Canine."
console.log(myDog.bark()); // "Woof!"
```

### Creating and Using Entities

Entities are ideal for models that represent database records or other identifiable resources.

**Example:**

```typescript
const Product = entityMixin(
  data({
    schema: z.object({
      name: z.string(),
      price: z.number(),
    }),
    methods: {
      discount(amount: number) {
        return this.copy({ price: this.price - amount });
      },
    },
  })
);

const product = Product({
  id: 'prod-1',
  name: 'Laptop',
  price: 1000,
});

const discountedProduct = product.discount(100);
console.log(discountedProduct.price); // 900
```

### Managing Complex States with Polymorphic Models

Polymorphic models are useful for managing entities that can be in different states with state-specific behaviors.

**Example:**

Refer to the `Order` and `Task` examples provided earlier to see how polymorphic models can handle complex state transitions.

---

## API Reference

### `data(options)`

Creates a data model.

- **Parameters:**
    - `options.schema`: Zod schema defining the data structure.
    - `options.methods`: Object containing instance methods.
    - `options.base` (optional): Base model to inherit from.

**Example:**

```typescript
const Model = data({ schema, methods, base });
```

### `polymorphicData(options)`

Creates a polymorphic data model.

- **Parameters:**
    - `options.discriminator`: String field used to differentiate variants.
    - `options.baseSchema`: Zod schema for shared properties.
    - `options.baseMethods`: Shared instance methods.
    - `options.schemas`: Object mapping variant names to Zod schemas.
    - `options.methods`: Object mapping variant names to methods.

**Example:**

```typescript
const PolyModel = polymorphicData({ discriminator, baseSchema, baseMethods, schemas, methods });
```

### `mixin(BaseModel, mixinFn)`

Adds additional functionality to a base model.

- **Parameters:**
    - `BaseModel`: The model to extend.
    - `mixinFn`: Function that returns a new model with added properties or methods.

**Example:**

```typescript
const ExtendedModel = mixin(BaseModel, (Base) => {
  // Add properties or methods
  return data({ base: Base, schema, methods });
});
```

### `entityMixin(BaseModel)`

Adds entity properties (`id`, `createdAt`, `updatedAt`) to a base model.

- **Parameters:**
    - `BaseModel`: The model to convert into an entity.

**Example:**

```typescript
const EntityModel = entityMixin(BaseModel);
```

### `entity(options)`

Creates an entity model with common entity properties.

- **Parameters:**
    - Same as `data(options)`, but includes entity properties.

**Example:**

```typescript
const EntityModel = entity({ schema, methods, base });
```

### `polymorphicEntity(options)`

Creates a polymorphic entity model.

- **Parameters:**
    - Same as `polymorphicData(options)`, but includes entity properties.

**Example:**

```typescript
const PolyEntity = polymorphicEntity({ discriminator, baseSchema, baseMethods, schemas, methods });
```

---

## Best Practices and Tips

- **Use `copy` for Immutability**: Always use the `copy` method to create modified instances to maintain immutability.
- **Leverage Mixins for Common Functionality**: Use mixins to DRY (Don't Repeat Yourself) up your code when multiple models share common properties or methods.
- **Keep Schemas Simple**: Break down complex schemas into smaller, reusable components for better maintainability.
- **Validate at Boundaries**: While **@launchstack/data** provides validation, ensure that data is validated at application boundaries (e.g., API endpoints) to prevent invalid data from entering your system.
- **Type Inference**: Let TypeScript infer types wherever possible to reduce redundancy and potential errors.