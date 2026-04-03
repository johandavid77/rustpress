use async_trait::async_trait;
use reqwest::Client;

use super::gateway::{PaymentGateway, PaymentIntent, PaymentResult, PaymentStatus};

pub struct StripeGateway {
    secret_key:    String,
    webhook_secret: String,
    client:        Client,
}

impl StripeGateway {
    pub fn new(secret_key: String, webhook_secret: String) -> Self {
        Self {
            secret_key,
            webhook_secret,
            client: Client::new(),
        }
    }

    fn auth(&self) -> String {
        format!("Bearer {}", self.secret_key)
    }
}

#[async_trait]
impl PaymentGateway for StripeGateway {
    fn name(&self) -> &str { "stripe" }

    async fn create_payment(&self, intent: PaymentIntent) -> anyhow::Result<PaymentResult> {
        // Convertir a centavos (Stripe usa enteros)
        let amount_cents = (intent.amount * 100.0) as u64;

        // Crear Checkout Session (más fácil que PaymentIntent para redirect)
        let res = self.client
            .post("https://api.stripe.com/v1/checkout/sessions")
            .header("Authorization", self.auth())
            .form(&[
                ("mode", "payment"),
                ("currency", &intent.currency),
                ("success_url", "https://tudominio.com/checkout/success?session_id={CHECKOUT_SESSION_ID}"),
                ("cancel_url",  "https://tudominio.com/checkout/cancel"),
                ("line_items[0][price_data][currency]",    &intent.currency),
                ("line_items[0][price_data][unit_amount]", &amount_cents.to_string()),
                ("line_items[0][price_data][product_data][name]", &intent.description),
                ("line_items[0][quantity]", "1"),
                ("metadata[order_id]", &intent.order_id.to_string()),
            ])
            .send().await?
            .json::<serde_json::Value>().await?;

        let session_id = res["id"].as_str().unwrap_or("").to_string();
        let checkout_url = res["url"].as_str().map(String::from);
        let status = match res["payment_status"].as_str() {
            Some("paid") => PaymentStatus::Completed,
            Some("unpaid") => PaymentStatus::Pending,
            _ => PaymentStatus::Pending,
        };

        Ok(PaymentResult {
            gateway:      "stripe".into(),
            external_id:  session_id,
            status,
            amount:       intent.amount,
            currency:     intent.currency,
            checkout_url,
            raw:          res,
        })
    }

    async fn get_payment(&self, external_id: &str) -> anyhow::Result<PaymentResult> {
        let res = self.client
            .get(format!("https://api.stripe.com/v1/checkout/sessions/{}", external_id))
            .header("Authorization", self.auth())
            .send().await?
            .json::<serde_json::Value>().await?;

        let status = match res["payment_status"].as_str() {
            Some("paid")   => PaymentStatus::Completed,
            Some("unpaid") => PaymentStatus::Pending,
            _              => PaymentStatus::Failed,
        };

        Ok(PaymentResult {
            gateway:     "stripe".into(),
            external_id: external_id.to_string(),
            status,
            amount:      res["amount_total"].as_f64().unwrap_or(0.0) / 100.0,
            currency:    res["currency"].as_str().unwrap_or("usd").to_string(),
            checkout_url: None,
            raw:         res,
        })
    }

    async fn handle_webhook(&self, payload: &[u8], signature: &str) -> anyhow::Result<PaymentResult> {
        // Verificar firma HMAC-SHA256 de Stripe
        use hmac::{Hmac, Mac};
        use sha2::Sha256;

        let sig_header = signature;
        let timestamp = sig_header.split(',')
            .find(|p| p.starts_with("t="))
            .and_then(|p| p.strip_prefix("t="))
            .unwrap_or("");
        let sig = sig_header.split(',')
            .find(|p| p.starts_with("v1="))
            .and_then(|p| p.strip_prefix("v1="))
            .unwrap_or("");

        let signed_payload = format!("{}.{}", timestamp, std::str::from_utf8(payload)?);
        let mut mac = Hmac::<Sha256>::new_from_slice(self.webhook_secret.as_bytes())?;
        mac.update(signed_payload.as_bytes());
        let expected = hex::encode(mac.finalize().into_bytes());

        if expected != sig {
            anyhow::bail!("Invalid Stripe webhook signature");
        }

        let event: serde_json::Value = serde_json::from_slice(payload)?;
        let session = &event["data"]["object"];
        let status = match session["payment_status"].as_str() {
            Some("paid") => PaymentStatus::Completed,
            _            => PaymentStatus::Pending,
        };

        Ok(PaymentResult {
            gateway:     "stripe".into(),
            external_id: session["id"].as_str().unwrap_or("").to_string(),
            status,
            amount:      session["amount_total"].as_f64().unwrap_or(0.0) / 100.0,
            currency:    session["currency"].as_str().unwrap_or("usd").to_string(),
            checkout_url: None,
            raw:         event,
        })
    }
}
