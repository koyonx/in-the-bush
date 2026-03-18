mod game;
mod room;
mod ws;

use axum::{
    extract::ws::WebSocketUpgrade,
    extract::State,
    response::IntoResponse,
    routing::get,
    Router,
};
use room::RoomManager;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;

pub type SharedState = Arc<RwLock<RoomManager>>;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let state: SharedState = Arc::new(RwLock::new(RoomManager::new()));

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    tracing::info!("Server running on 0.0.0.0:8080");
    println!("Server running on 0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<SharedState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| ws::handle_socket(socket, state))
}
