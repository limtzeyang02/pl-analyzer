use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::UpdaterExt;

#[derive(Clone, Serialize)]
struct UpdateStatus {
    status: String,
    progress: Option<f64>,
    message: String,
}

fn emit_status(app: &AppHandle, status: &str, progress: Option<f64>, message: &str) {
    let _ = app.emit(
        "update-status",
        UpdateStatus {
            status: status.into(),
            progress,
            message: message.into(),
        },
    );
}

async fn run_update_check(app: AppHandle) {
    emit_status(&app, "checking", None, "Checking for updates...");

    let Ok(updater) = app.updater() else {
        emit_status(&app, "error", None, "Could not initialise updater.");
        return;
    };

    const MAX_ATTEMPTS: u32 = 3;

    for attempt in 1..=MAX_ATTEMPTS {
        match updater.check().await {
            Ok(Some(update)) => {
                emit_status(&app, "downloading", Some(0.0), "Downloading update...");

                let downloaded = Arc::new(AtomicU64::new(0));
                let downloaded_clone = Arc::clone(&downloaded);
                let app_for_chunk = app.clone();
                let app_for_finish = app.clone();

                let _ = update
                    .download_and_install(
                        move |chunk_len, total| {
                            let d = downloaded_clone.fetch_add(chunk_len as u64, Ordering::Relaxed)
                                + chunk_len as u64;
                            let progress = total.map(|t| (d as f64 / t as f64) * 100.0);
                            let msg = format!("Downloading... {:.0}%", progress.unwrap_or(0.0));
                            emit_status(&app_for_chunk, "downloading", progress, &msg);
                        },
                        move || {
                            emit_status(
                                &app_for_finish,
                                "installing",
                                Some(100.0),
                                "Installing update...",
                            );
                        },
                    )
                    .await;

                return;
            }
            Ok(None) => {
                emit_status(&app, "up-to-date", None, "Up to date!");
                return;
            }
            Err(_) if attempt < MAX_ATTEMPTS => {
                emit_status(
                    &app,
                    "retrying",
                    None,
                    &format!(
                        "Could not reach update server, retrying... ({attempt}/{MAX_ATTEMPTS})"
                    ),
                );
                tokio::time::sleep(std::time::Duration::from_secs(10)).await;
                emit_status(&app, "checking", None, "Checking for updates...");
            }
            Err(_) => {
                emit_status(&app, "error", None, "Could not check for updates.");
            }
        }
    }
}

#[tauri::command]
pub fn start_update_check(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        run_update_check(app).await;
    });
}
