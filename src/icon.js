//import { invoke } from "@tauri-apps/api/tauri";
//import { appWindow } from "@tauri-apps/api/window";
const { invoke } = window.__TAURI__.core;
const { appWindow } = window.__TAURI__.window;
//const { menu } = window.__TAURI__.menu;

const appMenu = document.getElementById("weport");
const openMenu = document.getElementById("open-weport");
const closeMenu = document.getElementById("close-weport");

let isOpen = false;

// Remove default context menu
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

// Double-click on icon → Show main & hide icon
appMenu.addEventListener("dblclick", (e) => {
  e.preventDefault();
  toggleMenus();
});

function toggleMenus() {
  const openDisplay = getComputedStyle(openMenu).display;
  const closeDisplay = getComputedStyle(closeMenu).display;
  openMenu.style.display = (openDisplay === "none") ? "block" : "none";
  closeMenu.style.display = (closeDisplay === "none") ? "block" : "none";
}

openMenu.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("open menu clicked");
  if (isOpen) {
    isOpen = false;
    invoke("show_main", { show: false });
  } else {
    isOpen = true;
    invoke("show_main", { show: true });
  }
});

closeMenu.addEventListener("click", (e) => {
    e.preventDefault();
    invoke("exit_app");
});