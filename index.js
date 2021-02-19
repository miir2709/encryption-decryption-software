const {
    ipcRenderer
} = require('electron')
$ = require('jquery');
var $inputDiv = $("#inputDiv");
var $inputDi = $("#inputDi");

Noty.setMaxVisible(10);

// for(var i = 0; i<0; i++){
//     new Noty({
//         text: `Encountered error while processing!`,
//         type: 'error',
//         theme: 'sunset',
//     }).show();
// }

var workers = [];

$inputDiv.on('drop', function(e) {
    dropHandler(e);
});

$inputDiv.on('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
});

async function dropHandler(e) {
    e.preventDefault();
    var files = e.originalEvent.dataTransfer.files
    console.log("files: "+files)
    if (files) {
        Swal.fire({
            title: 'Enter a security key:',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Go!',
            allowOutsideClick: false,
        }).then((res) => { // entered security key
            if (res.value) {
                console.log(res.value);
                var numFiles = files.length;
                let enc = new TextEncoder();
                var keyAsBytes = enc.encode(res.value);
                console.log(keyAsBytes);
                for (var i = 0; i < files.length; i++) {
                    ipcRenderer.send('ondragstart', files[i].path);
                    console.log(files[i]);
                }
                console.log("hello i am going into handleFiles: ");
                handleFiles(files, keyAsBytes);
                console.log("bye i completed hellofiles");
                Swal.fire({
                    title: "Your file" + (numFiles > 1 ? "s are" : " is") + " being processed.",
                });
            }
        });

    } else {
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
        }
    }
}

function handleFiles(files, keyAsBytes) {
    console.log("Inside handleFiles: files: "+files);
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        console.log(f);
        console.log("about to spawn worker");
        var w = new Worker('resources/fileHandler.js'); // worker thread can perform tasks without interfering with the user interfac
        w.postMessage([f, keyAsBytes]);
        w.onmessage = function(e) {
            if(e.data.status!="success"){
                console.log("error");
                new Noty({
                    text: 'Encountered error while processing ${f.name}!',
                    type: 'error',
                    theme: 'sunset',
                }).show();
            }else{
                // console.log(e.data);
                new Noty({
                    text: `${e.data.fileNameToSave} is ready!`,
                    type: 'success',
                    theme: 'sunset',
                })
                .on('onClick', () => {
                    var blob = new Blob([e.data.bytesToSave], {
                        type: e.data.fileSaveType
                    });
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = e.data.fileNameToSave;
                    link.click();
                })
                .show();
            }
            w.terminate();
        }
        workers.push(w);
    }
}

function dragOverHandler(ev) {
    ev.preventDefault();
    for (let f of ev.dataTransfer.files) {
        // console.log('The file(s) you dragged: ', f)
        ipcRenderer.send('ondragstart', f.path)
    }
}

async function hash256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return (hash);
}

function getExtension(name) {
    return name.substring(name.lastIndexOf(".") + 1);
}



const electron = require('electron'); 
const path = require('path'); 
  
const dialog = electron.remote.dialog; 
  
var uploadFile = document.getElementById('upload'); 

  
// Defining a Global file path Variable to store  
// user-selected file 
global.filepath = undefined; 

if (uploadFile) {
    console.log(__dirname)
    uploadFile.addEventListener('click', () => {
        // If the platform is 'win32' or 'Linux' 
        if (process.platform !== 'darwin') {
            // Resolves to a Promise<Object> 
            dialog.showOpenDialog({
                title: 'Select the File to be uploaded',
                defaultPath: path.join(__dirname, ''),
                buttonLabel: 'Upload',
                // Restricting the user to only Text Files. 
                filters: [
                    {
                        name: 'Text Files',
                        extensions: ['txt', 'docx', 'mkv', 'mp4', 'mvi', 'mp3']
                    },],
                // Specifying the File Selector Property 
                properties: ['openFile']
            }).then(file => {
                // Stating whether dialog operation was 
                // cancelled or not. 
                console.log(file.canceled);
                if (!file.canceled) {
                    // Updating the GLOBAL filepath variable  
                    // to user-selected file. 
                    global.filepath = file.filePaths[0].toString();
                    console.log(global.filepath);
                }
            }).catch(err => {
                console.log(err)
            });
        }
        else {
            // If the platform is 'darwin' (macOS) 
            dialog.showOpenDialog({
                title: 'Select the File to be uploaded',
                defaultPath: path.join(__dirname, ''),
                buttonLabel: 'Upload',
                filters: [
                    {
                        name: 'Text Files',
                        extensions: ['txt', 'docx' , 'mkv', 'mp4', 'mvi', 'mp3']
                    },],
                // Specifying the File Selector and Directory
                // Selector Property In macOS
                properties: ['openFile', 'openDirectory']
            }).then(file => {
                console.log(file.canceled);
                if (!file.canceled) {
                    global.filepath = file.filePaths[0].toString();
                    console.log(global.filepath);
                }
            }).catch(err => {
                console.log(err)
            });
        }
    });
}