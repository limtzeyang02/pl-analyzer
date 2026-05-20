import "./css/main.css";
import { invoke } from "@tauri-apps/api/core";
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

createApp(App).use(createPinia()).use(router).mount("#app");

invoke("close_splashscreen");
