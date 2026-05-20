use std::sync::{
    atomic::{AtomicBool, AtomicU64, Ordering},
    Arc,
};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::UpdaterExt;

pub struct StartupState {
    update_done: AtomicBool,
    frontend_ready: AtomicBool,
    started: AtomicBool,
}

impl StartupState {
    pub fn new() -> Self {
        Self {
            update_done: AtomicBool::new(false),
            frontend_ready: AtomicBool::new(false),
            started: AtomicBool::new(false),
        }
    }
}

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

fn start_app(app: &AppHandle) {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }
}

fn maybe_start_app(app: &AppHandle) {
    let state = app.state::<StartupState>();
    if state.update_done.load(Ordering::Acquire)
        && state.frontend_ready.load(Ordering::Acquire)
        && !state.started.swap(true, Ordering::AcqRel)
    {
        start_app(app);
    }
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

/// Called by the splash screen when the update check reaches a terminal state.
#[tauri::command]
pub fn finish_startup(app: AppHandle) {
    app.state::<StartupState>()
        .update_done
        .store(true, Ordering::Release);
    maybe_start_app(&app);
}

/// Called by the main window's frontend once Vue has mounted and is ready.
#[tauri::command]
pub fn close_splashscreen(app: AppHandle) {
    app.state::<StartupState>()
        .frontend_ready
        .store(true, Ordering::Release);
    maybe_start_app(&app);
}
