use crate::payments::gateway::{PaymentIntent, PaymentStatus};
use crate::payments::stripe::StripeGateway;
use crate::payments::paypal::PayPalGateway;
use crate::payments::PaymentGateway;
use uuid::Uuid;

#[test] fn status_display() {
    assert_eq!(PaymentStatus::Pending.to_string(),   "pending");
    assert_eq!(PaymentStatus::Completed.to_string(), "completed");
    assert_eq!(PaymentStatus::Failed.to_string(),    "failed");
    assert_eq!(PaymentStatus::Refunded.to_string(),  "refunded");
    assert_eq!(PaymentStatus::Cancelled.to_string(), "cancelled");
}

#[test] fn status_eq() {
    assert_eq!(PaymentStatus::Completed, PaymentStatus::Completed);
    assert_ne!(PaymentStatus::Pending,   PaymentStatus::Failed);
}

#[test] fn payment_intent_fields() {
    let id = Uuid::new_v4();
    let intent = PaymentIntent {
        order_id: id, amount: 99.99,
        currency: "usd".into(), description: "Test".into(),
        metadata: serde_json::json!({}),
    };
    assert_eq!(intent.amount, 99.99);
    assert_eq!(intent.currency, "usd");
}

#[test] fn stripe_name()       { assert_eq!(StripeGateway::new("k".into(), "w".into()).name(), "stripe"); }
#[test] fn paypal_name()       { assert_eq!(PayPalGateway::new("i".into(), "s".into(), true).name(), "paypal"); }
#[test] fn paypal_live_name()  { assert_eq!(PayPalGateway::new("i".into(), "s".into(), false).name(), "paypal"); }
