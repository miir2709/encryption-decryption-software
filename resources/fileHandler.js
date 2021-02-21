console.log("HI. WORKER HERE");

onmessage = function(e) {
    //e.data
    var file = e.data[0];
    var reader = new FileReader();
    reader.onload = function() {
        if (getExtension(file.name) != "dcrypt") {
            var today = new Date();

            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            // console.log("encypt time before: " + time);
            encryptFile(file, this.result, e.data[1])
                .then((res) => {
                    // console.log(res);
                    res.status = "success";
                    // console.log("worker finished encrypting");
                    postMessage(res);
                    var today = new Date();
                    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                    // console.log("encypt time after: " + time);
                        })
                .catch(err => {
                    postMessage(err);
                }
            );

        } else {
            var today = new Date();
            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            console.log("decrypt time after: " + time);
            decryptFile(file, this.result, e.data[1])
                .then((res) => {
                    // console.log(res);
                    res.status = "success";
                    // console.log("worker finished decrypting");
                    postMessage(res);
                })
                .catch(err => {
                    err.status = "error";
                    postMessage(err);
                });
                today = new Date();
                var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                console.log("decrypt time after: " + time);
        }
    }
    reader.readAsArrayBuffer(file);
}

async function encryptFile(file, bytes, keyAsBytes) {
    var filename = file.name;
    var type = file.type;
    return importSecretKey(keyAsBytes)
        .then((cryptoKey) => {
            const salt = crypto.getRandomValues(new Uint8Array(32));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            return crypto.subtle.deriveKey({
                    name: 'PBKDF2',
                    salt,
                    iterations: 250000,
                    hash: {
                        name: 'SHA-256'
                    }
                }, cryptoKey, {
                    name: 'AES-GCM',
                    length: 256
                }, false, ['encrypt'])
                .then((aesKey) => {
                    let enc = new TextEncoder();
                    var textBytes = enc.encode(filename + ";" + type + ";");
                    var array = concatTypedArrays(textBytes, new Uint8Array(bytes));

                    return crypto.subtle.encrypt({
                        name: 'AES-GCM',
                        iv
                    }, aesKey, array);
                })
                .then((encryptedContent) => {
                    const encryptedBytes = new Uint8Array(encryptedContent);
                    // console.log(encryptedBytes);
                    const encryptedPackage = concatTypedArrays(concatTypedArrays(salt, iv), encryptedBytes)
                    // console.log(encryptedPackage);
                    return {
                        // bytesToSave: Base64.fromByteArray(encryptedPackage),
                        bytesToSave: encryptedPackage,
                        fileNameToSave: filename.substring(0, filename.lastIndexOf(".")) + ".dcrypt",
                        fileSaveType: "text/plain"
                    };
                });
        }
        )
}

async function decryptFile(file, bytes, keyAsBytes) {
    const salt = bytes.slice(0, 32);
    const iv = bytes.slice(32, 44);
    const encryptedData = bytes.slice(44);
    console.log(salt, iv, encryptedData, bytes);
    return importSecretKey(keyAsBytes)
        .then((cryptoKey) => {
            return crypto.subtle.deriveKey({
                    name: 'PBKDF2',
                    salt,
                    iterations: 250000,
                    hash: {
                        name: 'SHA-256'
                    }
                }, cryptoKey, {
                    name: 'AES-GCM',
                    length: 256
                }, false, ['decrypt'])
                .then((aesKey) => {
                    return crypto.subtle.decrypt({
                        name: 'AES-GCM',
                        iv
                    }, aesKey, encryptedData);
                })
                .then((decryptedContent) => {
                    const decryptedBytes = new Uint8Array(decryptedContent);
                    var s = convertEnoughBytes(decryptedBytes, ";", 2);

                    // console.log(s);
                    return {
                        bytesToSave: decryptedBytes.slice(getNthOccurrence(s, ";", 2)+1),
                        fileNameToSave: s.substring(0, getNthOccurrence(s, ";", 1)),
                        fileSaveType: s.substring(getNthOccurrence(s, ";", 1)+1, getNthOccurrence(s, ";", 2)),
                    };
                });
        });
}

function convertEnoughBytes(bytes, pat, n) {
    var end = 10;
    var cond = true;
    var res;
    var decoder = new TextDecoder("utf-8");
    while (cond && end < bytes.byteLength) {
        var partStr = decoder.decode(bytes.slice(0, end));
        if (getNthOccurrence(partStr, pat, n) != -1) {
            res = partStr;
            cond = false;
        } else {
            if (end == bytes.byteLength - 1) {
                res = "";
                cond = false;
            } else {
                end += 10;
                if (end >= bytes.byteLength) {
                    end = bytes.byteLength - 1;
                }
            }
        }
    }
    return res;
}

function importSecretKey(rawKey) {
    return crypto.subtle.importKey(
        "raw",
        rawKey,
        "PBKDF2",
        false,
        ["deriveKey"]
    );
}

function getExtension(name) {
    return name.substring(name.lastIndexOf(".") + 1);
}

function getNthOccurrence(str, pat, n) {
    var L = str.length,
        i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

function concatTypedArrays(a, b) { // a, b TypedArray of same type
    var c = new(a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}
