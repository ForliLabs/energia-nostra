import { describe, it, expect } from "vitest";
import { InMemoryStore } from "@/lib/db";

describe("db (InMemoryStore)", () => {
  it("creates and finds a record", async () => {
    const store = new InMemoryStore<{ id: string; name: string }>();
    await store.create({ id: "1", name: "Test" });
    const found = await store.findById("1");
    expect(found?.name).toBe("Test");
  });

  it("returns undefined for missing record", async () => {
    const store = new InMemoryStore<{ id: string }>();
    const found = await store.findById("missing");
    expect(found).toBeUndefined();
  });

  it("lists all records", async () => {
    const store = new InMemoryStore<{ id: string; val: number }>();
    await store.create({ id: "1", val: 10 });
    await store.create({ id: "2", val: 20 });
    const all = await store.findAll();
    expect(all).toHaveLength(2);
  });

  it("updates a record", async () => {
    const store = new InMemoryStore<{ id: string; name: string }>();
    await store.create({ id: "1", name: "Before" });
    await store.update("1", { name: "After" });
    const found = await store.findById("1");
    expect(found?.name).toBe("After");
  });

  it("deletes a record", async () => {
    const store = new InMemoryStore<{ id: string }>();
    await store.create({ id: "1" });
    const deleted = await store.delete("1");
    expect(deleted).toBe(true);
    expect(await store.findById("1")).toBeUndefined();
  });

  it("filters records", async () => {
    const store = new InMemoryStore<{ id: string; active: boolean }>();
    await store.create({ id: "1", active: true });
    await store.create({ id: "2", active: false });
    await store.create({ id: "3", active: true });
    const active = await store.filter((item) => item.active);
    expect(active).toHaveLength(2);
  });

  it("counts records", async () => {
    const store = new InMemoryStore<{ id: string }>();
    await store.create({ id: "1" });
    await store.create({ id: "2" });
    expect(await store.count()).toBe(2);
  });

  it("seeds records", async () => {
    const store = new InMemoryStore<{ id: string; name: string }>();
    store.seed([
      { id: "1", name: "A" },
      { id: "2", name: "B" },
    ]);
    expect(await store.count()).toBe(2);
  });
});
