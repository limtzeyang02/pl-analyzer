use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Manager};

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

fn start_app(app: &AppHandle) {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }
}

pub fn maybe_start_app(app: &AppHandle) {
    let state = app.state::<StartupState>();
    if state.update_done.load(Ordering::Acquire)
        && state.frontend_ready.load(Ordering::Acquire)
        && !state.started.swap(true, Ordering::AcqRel)
    {
        start_app(app);
    }
}

/// Called by the splash screen when the update check reaches a terminal state.
#[tauri::command]
pub fn finish_splashscreen(app: AppHandle) {
    app.state::<StartupState>()
        .update_done
        .store(true, Ordering::Release);
    maybe_start_app(&app);
}

/// Called by the main window's frontend once Vue has mounted and is ready.
#[tauri::command]
pub fn finish_frontend(app: AppHandle) {
    app.state::<StartupState>()
        .frontend_ready
        .store(true, Ordering::Release);
    maybe_start_app(&app);
}
