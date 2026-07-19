# Review Request — PAY-17 Duplicate Charge Repair

- **Run:** `RUN-PAY-17-001`
- **State:** `review_pending`
- **Candidate:** `.foundry-worktrees/RUN-PAY-17-001-PORTS` (verified, detached at `93ef28f`)
- **Scope:** two policy-approved files; no merge, deployment, or vault write.

## Requested decision

Approve or reject the candidate patch. Approval authorizes only the next
review-controlled workflow step; it does not authorize an automatic merge or
durable-memory write.

## Proof contract

`one logical checkout persists one payment`

## Before / after evidence

| Check | Frozen baseline | Candidate, independently verified |
|---|---|---|
| PAY-17 unit proof | Fails: expected 1, received 2 | Passes |
| Build | — | Passes |
| Health suite | — | Passes: 2/2 |
| Browser proof | Reproduces two charges | Passes: one payment after retry |

The verifier record is [RUN-PAY-17-001-verifier.json](../evidence/RUN-PAY-17-001-verifier.json).

## Exact candidate diff

```diff
diff --git a/src/services/checkout-service.ts b/src/services/checkout-service.ts
@@
-        // PAY-17 INTENTIONAL DEFECT:
-        // Each retry mutates the idempotency key. The gateway correctly deduplicates
-        // matching keys, but these keys differ, so a timeout after charge causes a
-        // second charge on retry. Do not fix this during Milestone 1.
-        const retryScopedKey = `${request.idempotencyKey}:attempt-${attempt}`;
-        capturedPayment = this.paymentGateway.charge(order.id, order.totalCents, retryScopedKey);
+        // One user-initiated checkout owns one idempotency key. A retry must
+        // preserve that identity so the gateway can return the first capture.
+        capturedPayment = this.paymentGateway.charge(order.id, order.totalCents, request.idempotencyKey);

diff --git a/tests/browser/pay-17.spec.ts b/tests/browser/pay-17.spec.ts
@@
-test("PAY-17 browser scenario visibly captures two payments after retry", async ({ page }, testInfo) => {
+test("PAY-17 browser scenario captures one payment after retry", async ({ page }, testInfo) => {
@@
-  await expect(page.getByTestId("payment-count")).toHaveText("Captured payments: 2");
+  await expect(page.getByTestId("payment-count")).toHaveText("Captured payments: 1");
   await expect(page.getByTestId("checkout-result")).toContainText("pay_1");
-  await expect(page.getByTestId("checkout-result")).toContainText("pay_2");
@@
-  // a fresh client idempotency key while preserving PAY-17's internal retry bug.
+  // a fresh client idempotency key while preserving retry identity per checkout.
   await page.getByRole("button", { name: /pay \$29\.00/i }).click();
-  await expect(page.getByTestId("payment-count")).toHaveText("Captured payments: 2");
-  await expect(page.getByTestId("checkout-result")).toContainText("pay_3");
-  await expect(page.getByTestId("checkout-result")).toContainText("pay_4");
+  await expect(page.getByTestId("payment-count")).toHaveText("Captured payments: 1");
+  await expect(page.getByTestId("checkout-result")).toContainText("pay_2");
```

## Review boundaries and limitation

- The PAY-17 unit proof was not modified.
- The candidate commit remains isolated from the frozen baseline and has no merge authority.
- The browser proof used the documented local Chrome fallback.
- The frozen demo repository remains unchanged.
