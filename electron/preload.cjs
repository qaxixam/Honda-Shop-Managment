const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("hbmsDesktop", {
  load: () => ipcRenderer.invoke("db:load"),
  save: (data) => ipcRenderer.invoke("db:save", data),
  chooseLocation: () => ipcRenderer.invoke("shop:choose-location"),
  location: () => ipcRenderer.invoke("shop:location"),
  backup: () => ipcRenderer.invoke("shop:backup"),
  import: () => ipcRenderer.invoke("shop:import"),
  deleteAll: () => ipcRenderer.invoke("shop:delete-all"),
  auth: {
    status: () => ipcRenderer.invoke("auth:status"),
    setup: (username, password) => ipcRenderer.invoke("auth:setup", { username, password }),
    login: (username, password) => ipcRenderer.invoke("auth:login", { username, password }),
  },
});
