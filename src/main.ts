import "./css/main.css";
import { invoke } from "@tauri-apps/api/core";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

createApp(App).use(createPinia()).use(router).mount("#app");

invoke("finish_frontend");
