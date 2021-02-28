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
    var files = e.originalEvent.dataTransfer.files // accepting files in [`file`] data type with attributes : name, path, etc
    if (files) {
        Swal.fire({
            title: 'Enter a security key:',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Go!',
            allowOutsideClick: false,
        }).then((res) => { // entered security key
            if (res.value) {
                // console.log(res.value);
                var numFiles = files.length;
                let enc = new TextEncoder();
                var keyAsBytes = enc.encode(res.value);
                for (var i = 0; i < files.length; i++) {
                    ipcRenderer.send('ondragstart', files[i].path); // sending path to Renderer code
                }
                
                Swal.fire({
                    title: "Your file" + (numFiles > 1 ? "s are" : " is") + " being processed.",
                });
                handleFiles(files, keyAsBytes);
            }
        });

    } else {
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
        }
    }
}

function handleFiles(files, keyAsBytes) {
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        console.log("file object has a `name`: " + f.name + " `path`: " + f.path);
        var w = new Worker('resources/fileHandler.js'); // worker thread can perform tasks without interfering with the user interface
        w.postMessage([f, keyAsBytes]);
        w.onmessage = function (e) { // e is the event
            if (e.data.status != "success") {
                console.log("error");
                new Noty({
                    text: 'Encountered error while processing ${f.name}!',
                    type: 'error',
                    theme: 'sunset',
                }).show();
            } else {
                // new Noty({
                //     text: `${e.data.fileNameToSave} is ready!`,
                //     type: 'success',
                //     theme: 'sunset',
                // })
                var blob = new Blob([e.data.bytesToSave], {
                    type: e.data.fileSaveType
                });
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob); // https://stackoverflow.com/questions/25547475/save-to-local-file-from-blob "which is a special url that points to an object in the browser's memory) :"
                // console.log("link: " + link + "link href: " + link.href);
                if (f.name.split('.').pop() == "dcrypt") { // encrypted file uploaded
                    sleep(1500).then(() => {
                        Swal.fire({
                            title: "Cross Roads",
                            showCancelButton: true,
                            confirmButtonText: 'Play Video',
                            allowOutsideClick: false,
                            cancelButtonText: 'Download Video',
                        })
                            .then((res) => {
                                // saving the newly created .dcrypt file begins here
                                if (res.value) { // call video player function
                                    document.getElementById("videoclip").style.visibility = "visible";
                                    document.getElementById("input").style.visibility = "hidden";
                                    var video = document.querySelector('video');
                                    video.srcObject = null; // make sure srcObject is empty and does not overlay our src
                                    video.src = window.URL.createObjectURL(blob);
                                    console.log("video src: " + video.src);
                                    video.play();
                                }
                                else if (res.dismiss === Swal.DismissReason.cancel) { // download video
                                    console.log("hello, you got me: ");
                                    downloadFile(link, e);
                                }
                            })
                    })
                }
                else { // mp4 file uploaded
                    Swal.fire({
                        title: "Download Encrypted File",
                        showCancelButton: true,
                        confirmButtonText: 'Yes',
                        allowOutsideClick: false,
                        cancelButtonText: 'Cancel',
                    }).then((res) => {
                        if (res.value) {
                            downloadFile(link, e);
                        }
                    })
                }
                w.terminate();
            }
            workers.push(w);
       }
    }
}
function dragOverHandler(ev) {
    ev.preventDefault();
    for (let f of ev.dataTransfer.files) {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
 
function downloadFile(link, e) { // fucntion working fine. Kudos!
    link.download = e.data.fileNameToSave;
    console.log("i go here:: link: " + link + " link.download: " + link.download);
    const contentType = 'application/octet-stream';
    mouseEvents = document.createEvent('MouseEvents');
    link.dataset.downloadurl = [contentType, link.download, link.href].join(':');
    mouseEvents.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    link.dispatchEvent(mouseEvents)
}