use actix_web::{web, HttpRequest, HttpResponse};
use actix_ws::Message;
use sqlx::PgPool;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

pub type WsClients = Arc<Mutex<HashMap<String, actix_ws::Session>>>;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/ws/notifications", web::get().to(ws_handler));
}

pub async fn broadcast(clients: &WsClients, msg: &str) {
    let mut map = clients.lock().unwrap();
    let mut dead = vec![];
    for (id, session) in map.iter_mut() {
        if session.text(msg.to_string()).await.is_err() {
            dead.push(id.clone());
        }
    }
    for id in dead { map.remove(&id); }
}

async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    clients: web::Data<WsClients>,
    _pool: web::Data<PgPool>,
) -> Result<HttpResponse, actix_web::Error> {
    let (res, mut session, mut msg_stream) = actix_ws::handle(&req, stream)?;

    let client_id = uuid::Uuid::new_v4().to_string();
    clients.lock().unwrap().insert(client_id.clone(), session.clone());

    actix_web::rt::spawn(async move {
        while let Some(Ok(msg)) = {
            use futures_util::StreamExt;
            msg_stream.next().await
        } {
            match msg {
                Message::Ping(bytes) => { let _ = session.pong(&bytes).await; }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    Ok(res)
}

pub fn configure_chat(cfg: &mut web::ServiceConfig) {
    cfg.route("/ws/chat", web::get().to(chat_handler));
}

async fn chat_handler(
    req: HttpRequest,
    stream: web::Payload,
    clients: web::Data<WsClients>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, actix_web::Error> {
    let username = query.get("user").cloned().unwrap_or_else(|| "Anonymous".into());
    let (res, mut session, mut msg_stream) = actix_ws::handle(&req, stream)?;

    let client_id = format!("chat:{}:{}", username, uuid::Uuid::new_v4());
    clients.lock().unwrap().insert(client_id.clone(), session.clone());

    let clients_clone = clients.clone();
    actix_web::rt::spawn(async move {
        use futures_util::StreamExt;
        while let Some(Ok(msg)) = msg_stream.next().await {
            match msg {
                actix_ws::Message::Text(text) => {
                    let payload = serde_json::json!({
                        "type": "chat",
                        "from": username,
                        "message": text.to_string(),
                        "timestamp": std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
                    }).to_string();
                    broadcast(&clients_clone, &payload).await;
                }
                actix_ws::Message::Ping(b) => { let _ = session.pong(&b).await; }
                actix_ws::Message::Close(_) => break,
                _ => {}
            }
        }
        clients_clone.lock().unwrap().remove(&client_id);
    });

    Ok(res)
}
