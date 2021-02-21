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
    console.log("Inside handleFiles:");
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        console.log("file object has an attribute `path`: " + f.path);
        console.log(f.name);
        var w = new Worker('resources/fileHandler.js'); // worker thread can perform tasks without interfering with the user interface
        w.postMessage([f, keyAsBytes]);
        w.onmessage = function (e) { // e is the event
            if(e.data.status!="success"){
                console.log("error");
                new Noty({
                    text: 'Encountered error while processing ${f.name}!',
                    type: 'error',
                    theme: 'sunset',
                }).show();
            }else{
                console.log("event.data: "+e.data.path);
                new Noty({
                    text: `${e.data.fileNameToSave} is ready!`,
                    type: 'success',
                    theme: 'sunset',
                })
                .on('onClick', () => { // saving the newly created .dcrypt file begins here
                    var blob = new Blob([e.data.bytesToSave], {
                        type: e.data.fileSaveType
                    });
                    console.log("blob: " + blob.type);
                    var link = document.createElement('a');
                    console.log(link);
                    link.href = window.URL.createObjectURL(blob); // https://stackoverflow.com/questions/25547475/save-to-local-file-from-blob "which is a special url that points to an object in the browser's memory) :"
                    console.log("link href: " + link.href);
                    if (f.name.split('.').pop() == "dcrypt") {
                        // call video player function
                        // console.log("success");
                    }
                    // else save the file
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
