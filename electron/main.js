const { app, BrowserWindow } = require('electron');
const path = require('path')

const isDev = process.argv.includes('--dev') || !app.isPackaged

function createWindow(){
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        // show: false,
        // backgroundColor: '#2e2c29',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    if(isDev){
        win.loadURL("http://localhost:5173")
        // Debug tools
        win.webContents.openDevTools()
    }
    else{
        win.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})