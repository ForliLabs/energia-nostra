import { describe, it, expect } from "vitest";
import {
  schemas,
  validationErrorResponse,
  string,
  number,
  boolean,
  optional,
  enumType,
  object,
} from "@/lib/validation";

describe("validation", () => {
  describe("string schema", () => {
    it("validates a valid string", () => {
      const schema = string({ min: 2, max: 10 });
      expect(schema.safeParse("hello").success).toBe(true);
    });

    it("rejects non-string", () => {
      const schema = string();
      expect(schema.safeParse(123).success).toBe(false);
    });

    it("rejects too short", () => {
      const schema = string({ min: 5 });
      expect(schema.safeParse("hi").success).toBe(false);
    });

    it("rejects too long", () => {
      const schema = string({ max: 3 });
      expect(schema.safeParse("toolong").success).toBe(false);
    });

    it("validates email format", () => {
      const schema = string({ email: true });
      expect(schema.safeParse("test@example.com").success).toBe(true);
      expect(schema.safeParse("notanemail").success).toBe(false);
    });

    it("validates pattern", () => {
      const schema = string({ pattern: /^[a-z]+$/ });
      expect(schema.safeParse("abc").success).toBe(true);
      expect(schema.safeParse("ABC").success).toBe(false);
    });
  });

  describe("number schema", () => {
    it("validates a valid number", () => {
      const schema = number({ min: 0, max: 100 });
      expect(schema.safeParse(50).success).toBe(true);
    });

    it("rejects NaN", () => {
      const schema = number();
      expect(schema.safeParse("not-a-number").success).toBe(false);
    });

    it("validates integer constraint", () => {
      const schema = number({ integer: true });
      expect(schema.safeParse(5).success).toBe(true);
      expect(schema.safeParse(5.5).success).toBe(false);
    });

    it("parses string numbers", () => {
      const schema = number({ min: 0 });
      expect(schema.safeParse("42").success).toBe(true);
    });
  });

  describe("boolean schema", () => {
    it("validates boolean", () => {
      const schema = boolean();
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(false).success).toBe(true);
      expect(schema.safeParse("true").success).toBe(false);
    });
  });

  describe("optional schema", () => {
    it("allows undefined", () => {
      const schema = optional(string());
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it("allows null", () => {
      const schema = optional(string());
      expect(schema.safeParse(null).success).toBe(true);
    });

    it("validates when present", () => {
      const schema = optional(string({ min: 3 }));
      expect(schema.safeParse("hi").success).toBe(false);
      expect(schema.safeParse("hello").success).toBe(true);
    });
  });

  describe("enum schema", () => {
    it("validates enum values", () => {
      const schema = enumType(["a", "b", "c"]);
      expect(schema.safeParse("a").success).toBe(true);
      expect(schema.safeParse("d").success).toBe(false);
    });
  });

  describe("object schema", () => {
    it("validates an object", () => {
      const schema = object({
        name: string({ min: 1 }),
        age: number({ min: 0 }),
      });
      expect(schema.safeParse({ name: "Test", age: 25 }).success).toBe(true);
    });

    it("collects all errors", () => {
      const schema = object({
        name: string({ min: 1 }),
        age: number({ min: 0 }),
      });
      const result = schema.safeParse({ name: "", age: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("rejects non-objects", () => {
      const schema = object({ name: string() });
      expect(schema.safeParse("string").success).toBe(false);
      expect(schema.safeParse(null).success).toBe(false);
    });
  });

  describe("API schemas", () => {
    it("validates login schema", () => {
      const result = schemas.login.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid login email", () => {
      const result = schemas.login.safeParse({
        email: "invalid",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("validates register schema", () => {
      const result = schemas.register.safeParse({
        email: "test@example.com",
        password: "MyStr0ng!Pass",
        name: "Mario Rossi",
      });
      expect(result.success).toBe(true);
    });

    it("validates member create schema with fiscal code", () => {
      const result = schemas.memberCreate.safeParse({
        name: "Mario Rossi",
        fiscalCode: "RSSMRA80A01D704Z",
        email: "mario@example.com",
        pod: "IT001E12345678",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid fiscal code", () => {
      const result = schemas.memberCreate.safeParse({
        name: "Mario Rossi",
        fiscalCode: "INVALID",
        email: "mario@example.com",
        pod: "IT001E12345678",
      });
      expect(result.success).toBe(false);
    });

    it("validates consent schema", () => {
      const result = schemas.consent.safeParse({
        purpose: "analytics",
        granted: true,
      });
      expect(result.success).toBe(true);
    });

    it("validates GDPR erasure schema", () => {
      const result = schemas.gdprErasure.safeParse({
        userId: "user-123",
        confirmation: "ELIMINA",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("validationErrorResponse", () => {
    it("returns 400 response with errors", () => {
      const response = validationErrorResponse(["Campo richiesto", "Email non valida"]);
      expect(response.status).toBe(400);
    });
  });
});
