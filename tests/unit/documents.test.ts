import { describe, expect, it } from "vitest";
import { applyDocumentVariables, generateSignatureOtp } from "@/lib/documents";

describe("documents iteration 2", () => {
  it("replaces known placeholders and resolves missing ones to em dash", () => {
    const content = "CER {{cerName}} - Presidente {{president}} - Campo mancante {{missing}}";
    const resolved = applyDocumentVariables(content, { cerName: "Energia Insieme", president: "Mario Rossi" });

    expect(resolved).toContain("CER Energia Insieme");
    expect(resolved).toContain("Presidente Mario Rossi");
    expect(resolved).toContain("Campo mancante —");
  });

  it("generates six digit signature OTP codes", () => {
    const otp = generateSignatureOtp();

    expect(otp).toMatch(/^\d{6}$/);
  });
});
