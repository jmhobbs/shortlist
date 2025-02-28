const { app, Menu, Tray, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path');
const fs = require('node:fs');

const shortlistPath = path.join(app.getPath("userData"), "shortlist.json");

let shortlist = [];

const MAX_LENGTH = 20;

try {
  shortlist = JSON.parse(fs.readFileSync(shortlistPath, 'utf8'));
} catch(err) {
  console.error(err);
  shortlist = ['Create a shortlist!'];
}

function icon(shortlist) {
  if(shortlist.length == 0) { return path.join(app.getAppPath(), 'assets/CheckTemplate.png'); }
  return path.join(app.getAppPath(), 'assets/LinesTemplate.png');
}

function title(list) {
  if(list.length == 0) { return ''; }
  const remaining = list.length - 1;
  let title = list[0];
  if(title.length > MAX_LENGTH) {
    title = title.slice(0, MAX_LENGTH) + '...';
  }
  if(remaining > 0) {
    title += ` (+${remaining})`;
  }
  return title
}

function tooltip(shortlist) {
  if(shortlist.length == 0) { return 'Nothing to do, go outside!'; }
  return shortlist[0];
}

app.dock.hide();

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    show: false,
    menuBarVisible: false,
    resizable: false,
    closable: false,
    movable: true,
    minimizable: false,
    excludedFromShownWindowsMenu: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'web', 'preload.js')
    }
  })

  win.loadFile(path.join(app.getAppPath(), 'web/index.html')).then(
    () => {
      win.webContents.send('set-shortlist', shortlist);
    }
  );

  win.on('blur', () => { win.hide(); });

  const tray = new Tray(icon(shortlist));
  tray.on('click', () => {
    if(win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Done!',
      click: () => {
        win.webContents.send('next');
      },
    },
    {
      label: 'Quit Shortlist',
      click: () => {
        app.exit();
      }
    },
  ])
  tray.on('right-click', () => { tray.popUpContextMenu(contextMenu); })

  tray.setTitle(title(shortlist));
  tray.setImage(icon(shortlist));
  tray.setToolTip(tooltip(shortlist));

  ipcMain.on('sync', (_, items) => {
    shortlist = items;
    tray.setTitle(title(shortlist));
    tray.setImage(icon(shortlist));
    tray.setToolTip(tooltip(shortlist));
    fs.writeFileSync(shortlistPath, JSON.stringify(shortlist));
  });
  ipcMain.on('close', () => { win.hide(); });
})
