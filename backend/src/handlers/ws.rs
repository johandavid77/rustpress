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
