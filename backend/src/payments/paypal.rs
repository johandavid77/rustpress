use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;
use base64::{engine::general_purpose::STANDARD, Engine};

use super::gateway::{PaymentGateway, PaymentIntent, PaymentResult, PaymentStatus};

pub struct PayPalGateway {
    client_id:     String,
    client_secret: String,
    sandbox:       bool,
    client:        Client,
}

impl PayPalGateway {
    pub fn new(client_id: String, client_secret: String, sandbox: bool) -> Self {
        Self { client_id, client_secret, sandbox, client: Client::new() }
    }

    fn base_url(&self) -> &str {
        if self.sandbox { "https://api-m.sandbox.paypal.com" }
        else            { "https://api-m.paypal.com" }
    }

    async fn access_token(&self) -> anyhow::Result<String> {
        let creds = STANDARD.encode(format!("{}:{}", self.client_id, self.client_secret));
        let res = self.client
            .post(format!("{}/v1/oauth2/token", self.base_url()))
            .header("Authorization", format!("Basic {}", creds))
            .form(&[("grant_type", "client_credentials")])
            .send().await?
            .json::<serde_json::Value>().await?;
        Ok(res["access_token"].as_str().unwrap_or("").to_string())
    }
}

#[async_trait]
impl PaymentGateway for PayPalGateway {
    fn name(&self) -> &str { "paypal" }

    async fn create_payment(&self, intent: PaymentIntent) -> anyhow::Result<PaymentResult> {
        let token = self.access_token().await?;

        let body = json!({
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": intent.order_id.to_string(),
                "description":  intent.description,
                "amount": {
                    "currency_code": intent.currency.to_uppercase(),
                    "value": format!("{:.2}", intent.amount),
                }
            }],
            "application_context": {
                "return_url": "https://tudominio.com/checkout/success",
                "cancel_url": "https://tudominio.com/checkout/cancel",
                "brand_name": "RustCMS Shop",
                "user_action": "PAY_NOW",
            }
        });

        let res = self.client
            .post(format!("{}/v2/checkout/orders", self.base_url()))
            .header("Authorization", format!("Bearer {}", token))
            .json(&body)
            .send().await?
            .json::<serde_json::Value>().await?;

        let order_id = res["id"].as_str().unwrap_or("").to_string();
        let checkout_url = res["links"].as_array()
            .and_then(|links| links.iter().find(|l| l["rel"] == "approve"))
            .and_then(|l| l["href"].as_str())
            .map(String::from);

        Ok(PaymentResult {
            gateway:     "paypal".into(),
            external_id: order_id,
            status:      PaymentStatus::Pending,
            amount:      intent.amount,
            currency:    intent.currency,
            checkout_url,
            raw:         res,
        })
    }

    async fn get_payment(&self, external_id: &str) -> anyhow::Result<PaymentResult> {
        let token = self.access_token().await?;
        let res = self.client
            .get(format!("{}/v2/checkout/orders/{}", self.base_url(), external_id))
            .header("Authorization", format!("Bearer {}", token))
            .send().await?
            .json::<serde_json::Value>().await?;

        let status = match res["status"].as_str() {
            Some("COMPLETED") => PaymentStatus::Completed,
            Some("APPROVED")  => PaymentStatus::Pending,
            Some("VOIDED")    => PaymentStatus::Cancelled,
            _                 => PaymentStatus::Pending,
        };

        let amount = res["purchase_units"][0]["amount"]["value"]
            .as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
        let currency = res["purchase_units"][0]["amount"]["currency_code"]
            .as_str().unwrap_or("USD").to_lowercase();

        Ok(PaymentResult {
            gateway:     "paypal".into(),
            external_id: external_id.to_string(),
            status, amount, currency,
            checkout_url: None,
            raw: res,
        })
    }

    async fn handle_webhook(&self, payload: &[u8], _signature: &str) -> anyhow::Result<PaymentResult> {
        let event: serde_json::Value = serde_json::from_slice(payload)?;
        let resource = &event["resource"];
        let status = match event["event_type"].as_str() {
            Some("PAYMENT.CAPTURE.COMPLETED") => PaymentStatus::Completed,
            Some("PAYMENT.CAPTURE.DENIED")    => PaymentStatus::Failed,
            Some("PAYMENT.CAPTURE.REFUNDED")  => PaymentStatus::Refunded,
            _                                  => PaymentStatus::Pending,
        };
        let amount = resource["amount"]["value"]
            .as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);

        Ok(PaymentResult {
            gateway:     "paypal".into(),
            external_id: resource["id"].as_str().unwrap_or("").to_string(),
            status, amount,
            currency:    resource["amount"]["currency_code"].as_str().unwrap_or("usd").to_lowercase(),
            checkout_url: None,
            raw:         event,
        })
    }
}
