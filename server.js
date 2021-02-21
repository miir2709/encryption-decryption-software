// const path = require('path');
// const express = require('express');
// const parser = require('body-parser');
// const cors = require('cors');
// const exp = express();
// const server = require('http').Server(exp);
const fs = require('fs');
const {
    app,
    BrowserWindow,
    ipcMain,
    Menu
} = require('electron')

const shell = require('electron').shell

require('electron-reload')(__dirname);
function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        backgroundColor: '#2e2c29',
        width: 970,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })
    // and load the index.html of the app.
    win.loadFile('index.html')
}

const template = [
    {
       label: 'View',
       submenu: [
          {
             role: 'reload'
          },
          {
             role: 'toggledevtools'
          },
          {
             type: 'separator'
          },
          {
             role: 'resetzoom'
          },
          {
             role: 'zoomin'
          },
          {
             role: 'zoomout'
          },
          {
             type: 'separator'
          },
          {
             role: 'togglefullscreen'
          }
       ]
    },
    {
       role: 'window',
       submenu: [
          {
             role: 'minimize'
          },
          {
             role: 'close'
          }
       ]
    },

    {
       role: 'help',
       submenu: [
          {
               label: 'Documentation on Git',
               click() {
                shell.openExternal('https://github.com/miir2709/encryption-decryption-software')
            }
          }
       ]
    }
 ]
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
app.whenReady().then(createWindow)
