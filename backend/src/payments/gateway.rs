use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentIntent {
    pub order_id:    Uuid,
    pub amount:      f64,       // en la moneda base (USD, COP, etc)
    pub currency:    String,    // "usd", "cop"
    pub description: String,
    pub metadata:    serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentResult {
    pub gateway:        String,
    pub external_id:    String,   // ID en Stripe/PayPal
    pub status:         PaymentStatus,
    pub amount:         f64,
    pub currency:       String,
    pub checkout_url:   Option<String>,  // URL para redirigir al usuario
    pub raw:            serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
    Refunded,
    Cancelled,
}

impl std::fmt::Display for PaymentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            PaymentStatus::Pending   => write!(f, "pending"),
            PaymentStatus::Completed => write!(f, "completed"),
            PaymentStatus::Failed    => write!(f, "failed"),
            PaymentStatus::Refunded  => write!(f, "refunded"),
            PaymentStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

#[async_trait]
pub trait PaymentGateway: Send + Sync {
    fn name(&self) -> &str;

    /// Crear un payment intent / orden de pago
    async fn create_payment(&self, intent: PaymentIntent) -> anyhow::Result<PaymentResult>;

    /// Verificar estado de un pago por su ID externo
    async fn get_payment(&self, external_id: &str) -> anyhow::Result<PaymentResult>;

    /// Procesar webhook entrante — retorna el PaymentResult actualizado
    async fn handle_webhook(
        &self,
        payload: &[u8],
        signature: &str,
    ) -> anyhow::Result<PaymentResult>;
}
