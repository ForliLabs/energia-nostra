// Database placeholder - each project will configure its own data layer
// For MVP, we use in-memory data stores; swap for Prisma/database in production

export type DbRecord = Record<string, unknown>;

export class InMemoryStore<T extends DbRecord & { id: string }> {
  private data: Map<string, T> = new Map();

  async findAll(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  async findById(id: string): Promise<T | undefined> {
    return this.data.get(id);
  }

  async create(item: T): Promise<T> {
    this.data.set(item.id, item);
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    const existing = this.data.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates } as T;
    this.data.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    return Array.from(this.data.values()).filter(predicate);
  }

  async count(): Promise<number> {
    return this.data.size;
  }

  seed(items: T[]): void {
    items.forEach((item) => this.data.set(item.id, item));
  }
}
