// Buying a plan: the hand-off point for the payment gateway.
//
// GetStartedPage collects everything needed to open a company and calls
// startCheckout(order). Payment isn't connected yet, so it fails with
// PAYMENT_NOT_CONNECTED and nothing is saved.
//
// To connect Razorpay (test mode first):
//   1. Backend: POST /api/public/checkout/order validates the order, checks
//      the slug and email are free, creates a Razorpay order for
//      planPrice x 100 paise, and returns { orderId, amount, keyId }.
//      Keep the order details server-side against orderId.
//   2. Here: load https://checkout.razorpay.com/v1/checkout.js, open
//      new window.Razorpay({ key: keyId, order_id: orderId, amount, ... }).
//   3. Backend: POST /api/public/checkout/verify checks the payment
//      signature (HMAC-SHA256 of `${orderId}|${paymentId}` with the key
//      secret). Only then create the company and its first admin, the same
//      way createOrganization in controllers/platform.controller.js does.
//   4. Send the buyer to /login.
//
// order: {
//   plan: "pro", billing: "monthly" | "yearly", amount: <rupees>,
//   company: { name, slug },
//   admin: { name, email, password },
// }

export const PAYMENT_NOT_CONNECTED = "PAYMENT_NOT_CONNECTED";

export async function startCheckout(order) {
  void order;
  const error = new Error(
    "Online payment isn't connected yet, so your company wasn't created and nothing was charged."
  );
  error.code = PAYMENT_NOT_CONNECTED;
  throw error;
}
