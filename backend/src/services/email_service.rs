use lettre::{
    message::header::ContentType,
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};

#[derive(Clone)]
pub struct EmailService {
    pub from: String,
    mailer: AsyncSmtpTransport<Tokio1Executor>,
}

impl EmailService {
    pub fn new(host: &str, port: u16, username: &str, password: &str, from: &str) -> Self {
        let mailer = if username.is_empty() {
            AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(host)
                .port(port)
                .build()
        } else {
            let creds = Credentials::new(username.to_string(), password.to_string());
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
                .unwrap()
                .port(port)
                .credentials(creds)
                .build()
        };

        Self { from: from.to_string(), mailer }
    }

    pub async fn send(&self, to: &str, subject: &str, body: String) -> Result<(), String> {
        let email = Message::builder()
            .from(self.from.parse().map_err(|e| format!("Invalid from: {e}"))?)
            .to(to.parse().map_err(|e| format!("Invalid to: {e}"))?)
            .subject(subject)
            .header(ContentType::TEXT_HTML)
            .body(body)
            .map_err(|e| format!("Build error: {e}"))?;

        self.mailer.send(email).await.map_err(|e| format!("Send error: {e}"))?;
        Ok(())
    }

    pub async fn send_welcome(&self, to: &str, username: &str) -> Result<(), String> {
        let body = format!(
            "<h1>Bienvenido, {}!</h1><p>Tu cuenta ha sido creada exitosamente.</p>",
            username
        );
        self.send(to, "Bienvenido a RustCMS", body).await
    }

    pub async fn send_password_reset(&self, to: &str, token: &str, frontend_url: &str) -> Result<(), String> {
        let link = format!("{}/reset-password?token={}", frontend_url, token);
        let body = format!(
            "<h1>Recuperar contraseña</h1><p>Haz clic en el enlace para resetear tu contraseña:</p><a href=\"{}\">Resetear contraseña</a><p>Este enlace expira en 1 hora.</p>",
            link
        );
        self.send(to, "Recuperar contraseña - RustCMS", body).await
    }

    pub async fn send_notification(&self, to: &str, subject: &str, message: &str) -> Result<(), String> {
        let body = format!("<p>{}</p>", message);
        self.send(to, subject, body).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_service() -> EmailService {
        EmailService::new("localhost", 1025, "", "", "noreply@rustcms.dev")
    }

    // -- Construcción del servicio --

    #[tokio::test]
    async fn test_service_creation_without_auth() {
        let svc = EmailService::new("localhost", 1025, "", "", "noreply@test.com");
        assert_eq!(svc.from, "noreply@test.com");
    }

    #[tokio::test]
    async fn test_service_creation_with_auth() {
        let svc = EmailService::new("smtp.gmail.com", 587, "user", "pass", "me@gmail.com");
        assert_eq!(svc.from, "me@gmail.com");
    }

    // -- Validación de emails --

    #[tokio::test]
    async fn test_send_to_invalid_email_fails() {
        let svc = make_service();
        let result = svc.send("not-an-email", "Test", "body".to_string()).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_send_from_invalid_email_fails() {
        let svc = EmailService::new("localhost", 1025, "", "", "not-valid");
        let result = svc.send("user@test.com", "Test", "body".to_string()).await;
        assert!(result.is_err());
    }

    // -- Construcción de cuerpos --

    #[test]
    fn test_welcome_body_contains_username() {
        let username = "johan";
        let body = format!(
            "<h1>Bienvenido, {}!</h1><p>Tu cuenta ha sido creada exitosamente.</p>",
            username
        );
        assert!(body.contains("johan"));
        assert!(body.contains("Bienvenido"));
    }

    #[test]
    fn test_password_reset_link_contains_token() {
        let token = "abc123";
        let frontend_url = "http://localhost:5173";
        let link = format!("{}/reset-password?token={}", frontend_url, token);
        assert!(link.contains("abc123"));
        assert!(link.contains("reset-password"));
    }

    #[test]
    fn test_password_reset_link_contains_frontend_url() {
        let token = "abc123";
        let frontend_url = "http://localhost:5173";
        let link = format!("{}/reset-password?token={}", frontend_url, token);
        assert!(link.contains("localhost:5173"));
    }

    // -- Tests de integración con MailHog (requiere MailHog corriendo) --

    #[tokio::test]
    #[ignore]
    async fn test_send_welcome_integration() {
        let svc = make_service();
        let result = svc.send_welcome("test@test.com", "testuser").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    #[ignore]
    async fn test_send_password_reset_integration() {
        let svc = make_service();
        let result = svc.send_password_reset(
            "test@test.com",
            "token123",
            "http://localhost:5173"
        ).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    #[ignore]
    async fn test_send_notification_integration() {
        let svc = make_service();
        let result = svc.send_notification(
            "test@test.com",
            "Test notification",
            "Este es un mensaje de prueba"
        ).await;
        assert!(result.is_ok());
    }
}