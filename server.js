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
    ipcMain
} = require('electron')

require('electron-reload')(__dirname);

function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 970,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })
    // and load the index.html of the app.
    win.loadFile('index.html')
}

// ipcMain.on('ondragstart', (event, filePath) => {

//     readFile(filePath);

//     function readFile(filepath) {
//         fs.readFile(filepath, 'utf-8', (err, data) => {

//             if (err) {
//                 alert("An error ocurred reading the file :" + err.message)
//                 return
//             }
//             console.log("hello there. uploading the file!!");
//             // handle the file content
//             event.sender.send('fileData', data)
//         })
//     }

// })


app.whenReady().then(createWindow)
