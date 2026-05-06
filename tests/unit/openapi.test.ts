import { describe, it, expect } from "vitest";
import { generateOpenApiSpec } from "@/lib/openapi";

describe("openapi", () => {
  it("generates valid OpenAPI 3.1 spec", () => {
    const spec = generateOpenApiSpec();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toBe("EnergiaNostra API");
    expect(spec.info.version).toBe("1.0.0");
  });

  it("includes all major API paths", () => {
    const spec = generateOpenApiSpec();
    const paths = Object.keys(spec.paths);
    expect(paths).toContain("/api/auth/login");
    expect(paths).toContain("/api/auth/register");
    expect(paths).toContain("/api/health");
    expect(paths).toContain("/api/metrics");
    expect(paths).toContain("/api/gdpr/export");
    expect(paths).toContain("/api/gdpr/erasure");
    expect(paths).toContain("/api/vpp");
    expect(paths).toContain("/api/digital-twin");
  });

  it("defines security schemes", () => {
    const spec = generateOpenApiSpec();
    expect(spec.components.securitySchemes.cookieAuth).toBeDefined();
    expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
  });

  it("defines request/response schemas", () => {
    const spec = generateOpenApiSpec();
    expect(spec.components.schemas.LoginRequest).toBeDefined();
    expect(spec.components.schemas.LoginResponse).toBeDefined();
    expect(spec.components.schemas.Error).toBeDefined();
  });

  it("includes all tags", () => {
    const spec = generateOpenApiSpec();
    const tagNames = spec.tags.map((t) => t.name);
    expect(tagNames).toContain("Auth");
    expect(tagNames).toContain("CER");
    expect(tagNames).toContain("GDPR");
    expect(tagNames).toContain("System");
    expect(tagNames).toContain("Moonshot");
  });

  it("has at least 10 documented endpoints", () => {
    const spec = generateOpenApiSpec();
    const endpointCount = Object.keys(spec.paths).length;
    expect(endpointCount).toBeGreaterThanOrEqual(10);
  });
});
