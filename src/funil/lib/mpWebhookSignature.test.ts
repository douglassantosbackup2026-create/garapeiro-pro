import { describe, expect, it } from "vitest";
import {
  signMpWebhookForTest,
  validateMpWebhookSignature,
} from "./mpWebhookSignature";

describe("validateMpWebhookSignature", () => {
  it("aceita assinatura válida do Mercado Pago", async () => {
    const secret = "test-webhook-secret";
    const dataId = "123456789";
    const requestId = "req-abc-001";
    const ts = String(Date.now());
    const xSignature = await signMpWebhookForTest({
      dataId,
      requestId,
      ts,
      secret,
    });

    const ok = await validateMpWebhookSignature({
      xSignature,
      xRequestId: requestId,
      dataId,
      secret,
      nowMs: Number(ts),
    });
    expect(ok).toBe(true);
  });

  it("rejeita assinatura adulterada", async () => {
    const secret = "test-webhook-secret";
    const ts = String(Date.now());
    const xSignature = await signMpWebhookForTest({
      dataId: "1",
      requestId: "r",
      ts,
      secret,
    });

    const ok = await validateMpWebhookSignature({
      xSignature: xSignature.replace(/v1=./, "v1=0"),
      xRequestId: "r",
      dataId: "1",
      secret,
      nowMs: Number(ts),
    });
    expect(ok).toBe(false);
  });

  it("rejeita timestamp fora da janela", async () => {
    const secret = "test-webhook-secret";
    const ts = String(Date.now() - 10 * 60 * 1000);
    const xSignature = await signMpWebhookForTest({
      dataId: "1",
      requestId: "r",
      ts,
      secret,
    });

    const ok = await validateMpWebhookSignature({
      xSignature,
      xRequestId: "r",
      dataId: "1",
      secret,
      nowMs: Date.now(),
      maxSkewMs: 60_000,
    });
    expect(ok).toBe(false);
  });
});
