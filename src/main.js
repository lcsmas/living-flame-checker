const { app, BrowserWindow, Tray, Menu, ipcMain  } = require("electron");
if (require('electron-squirrel-startup')) app.quit();
const path = require('path')
const AutoLaunch = require('auto-launch');

let win;
let tray;
let audioPlayedEvent;
let autoLauncher;

async function createWindow() {
  win = new BrowserWindow({
    width: 250,
    height: 250,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  await win.loadFile("src/index.html");

  win.setMenu(null)

  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  win.on('minimize', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win?.hide(); 
    }
  });
}

async function setupAutoload() {
  autoLauncher = new AutoLaunch({
    name: 'LivingFlameStatusChecker',
    path: app.getPath('exe'),
  });
  await autoLauncher.enable();
  autoLauncher.isEnabled()
  .then(async function(isEnabled){
      if(isEnabled){
          return;
      }
      await autoLauncher.enable();
  })
}

app.whenReady().then(async () => {
  await createWindow()
  await setupAutoload();
  tray = new Tray(path.join(__dirname, 'flames.png'));
  tray.setToolTip('Living Flame status');
  
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show                                  ', click: () => win?.show() },
    { label: 'Mute music', click: () => { audioPlayedEvent?.sender.send('mute-music') } },
    { label: 'Exit', click: () => { app.isQuitting = true; app.quit(); } }
  ]));

  tray.on('click', () => { 
    win?.isVisible() ? win.hide() : win.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

ipcMain.on('audio-played', (event) => {
  audioPlayedEvent = event
}); 

ipcMain.on('autolaunch-toggled', async () => {
  if(await autoLauncher.isEnabled()) {
    await autoLauncher?.disable()
  } else {
    await autoLauncher?.enable()
  }
}); 