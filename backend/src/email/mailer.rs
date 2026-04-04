use lettre::{
    message::{header::ContentType, Mailbox},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};
use std::str::FromStr;

#[derive(Clone)]
pub struct Mailer {
    transport: AsyncSmtpTransport<Tokio1Executor>,
    from:      Mailbox,
}

impl Mailer {
    pub fn from_env() -> anyhow::Result<Option<Self>> {
        let host = std::env::var("SMTP_HOST").unwrap_or_default();
        if host.is_empty() {
            tracing::warn!("SMTP_HOST not set — email disabled");
            return Ok(None);
        }

        let port: u16 = std::env::var("SMTP_PORT")
            .unwrap_or("587".into()).parse().unwrap_or(587);
        let user   = std::env::var("SMTP_USER").unwrap_or_default();
        let pass   = std::env::var("SMTP_PASS").unwrap_or_default();
        let from_email = std::env::var("SMTP_FROM")
            .unwrap_or_else(|_| format!("noreply@{}", host));
        let from_name  = std::env::var("SMTP_FROM_NAME")
            .unwrap_or("RustCMS".into());

        let creds = Credentials::new(user, pass);
        let transport = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&host)?
            .port(port)
            .credentials(creds)
            .build();

        let from = Mailbox::from_str(&format!("{} <{}>", from_name, from_email))?;

        Ok(Some(Self { transport, from }))
    }

    pub async fn send(&self, to: &str, subject: &str, html: &str) -> anyhow::Result<()> {
        let to_mailbox = Mailbox::from_str(to)?;
        let email = Message::builder()
            .from(self.from.clone())
            .to(to_mailbox)
            .subject(subject)
            .header(ContentType::TEXT_HTML)
            .body(html.to_string())?;

        self.transport.send(email).await?;
        tracing::info!("Email sent to {}", to);
        Ok(())
    }

    /// Fire-and-forget — no bloquea si falla
    pub fn send_bg(&self, to: String, subject: String, html: String) {
        let mailer = self.clone();
        tokio::spawn(async move {
            if let Err(e) = mailer.send(&to, &subject, &html).await {
                tracing::warn!("Email failed to {}: {}", to, e);
            }
        });
    }
}
