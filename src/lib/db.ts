/**
 * In-Memory Data Store — Generic repository for MVP/demo data persistence.
 *
 * Provides a `Map`-backed store with async CRUD operations that mirror the
 * Prisma client API shape. Use this for rapid prototyping; swap to Prisma
 * queries for production persistence.
 *
 * @module db
 *
 * @example
 * ```ts
 * interface User extends DbRecord { id: string; name: string; email: string }
 * const users = new InMemoryStore<User>();
 * await users.create({ id: "1", name: "Mario", email: "mario@example.it" });
 * const all = await users.findAll();
 * ```
 */

/** Base constraint for records stored in {@link InMemoryStore}. */
export type DbRecord = Record<string, unknown>;

/**
 * Generic in-memory data store backed by a `Map<string, T>`.
 *
 * All methods are async to match the Prisma client interface and allow
 * seamless migration to database-backed storage.
 *
 * @typeParam T - Record type extending `DbRecord` with a required `id` field.
 */
export class InMemoryStore<T extends DbRecord & { id: string }> {
  private data: Map<string, T> = new Map();

  /** Retrieve all records. */
  async findAll(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  /** Find a record by its unique ID, or `undefined` if not found. */
  async findById(id: string): Promise<T | undefined> {
    return this.data.get(id);
  }

  /** Insert a new record. Overwrites if a record with the same ID exists. */
  async create(item: T): Promise<T> {
    this.data.set(item.id, item);
    return item;
  }

  /** Partially update a record by ID. Returns the updated record, or `undefined` if not found. */
  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    const existing = this.data.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates } as T;
    this.data.set(id, updated);
    return updated;
  }

  /** Delete a record by ID. Returns `true` if the record existed. */
  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  /** Filter records by a predicate function. */
  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    return Array.from(this.data.values()).filter(predicate);
  }

  /** Return the total number of records. */
  async count(): Promise<number> {
    return this.data.size;
  }

  /** Bulk-insert records for initial data seeding. */
  seed(items: T[]): void {
    items.forEach((item) => this.data.set(item.id, item));
  }
}
