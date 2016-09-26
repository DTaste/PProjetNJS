


// Config
var ipfsHost = 'ipfs.infura.io';
var ipfsAPIPort = '5001';
var ipfsWebPort = '8080';


// IPFS
var ipfs = window.IpfsApi(ipfsHost, ipfsAPIPort, {protocol: 'https'});
ipfs.swarm.peers(function (err, response) {
    if (err) {
        console.error(err);
    } else {
        console.log("IPFS - connected to " + response.length + " peers");
        console.log(response);
    }
});




if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    document.getElementById("noMetamask").style.display = 'block';
    //web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var account = web3.eth.accounts[0];

var sendDataObject = {
    from: account,
    gas: 300000,
};



var fileStorageContract = web3.eth.contract(contractAbi).at(contractAddress);


// Globals... who cares...      
window.web3 = web3;
window.account = account;
window.fileStorageContract = fileStorageContract;
window.currentData = "";
window.currentFile = 0;
window.ipfsDataHost = "https://" + ipfsHost + "/ipfs";

var publishEvents = window.fileStorageContract.PublishEvent({_from: window.account}, {fromBlock: 0, toBlock: 'latest'});


String.prototype.trunc =
        function (n) {
            return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
        };

function clearStatus() {
    var status = document.getElementById("status");
    status.innerHTML = "";
}
;

function setStatus(message) {
    var status = document.getElementById("status");
    status.innerHTML += "<p>" + message + "</p>";
}
;


function getHashRecordCallback(err, result) {
    if (err) {
        setStatus('Error calling smart contract');
    } else if (result) {
        console.log(result);
        setStatus("Publisher : "  + result[0]);
        setStatus("Timestamp : "  + new Date(result[1] * 1000));
        setStatus("Filename : "  + result[2]);
        flink = result[3];
        setStatus("File link : "  + "<a href=\"" + flink + "\"  download=\""+result[2]+"\">" + flink.trunc(70) + "</a>");
        setStatus("Block : #"  + result[4]+ "<a href=\"http://testnet.etherscan.io/block/" + result[4] + "\"  target=\"_blank\"> See in Etherscan </a>");
        
    } else {
        setStatus('No data found');
    }
    
}

function addHistoryLine(spanHistory, hashfile) {
    

    window.fileStorageContract.getHashRecord.call(hashfile, function (err, result) {
        record = "";
        record +="<p> <a href=\"http://testnet.etherscan.io/block/" + result[4] + "\"  target=\"_blank\"> Block #" + result[4] + "</a>" + "\t" + new Date(result[1] * 1000) + "</p>";
        record +="<p> From : "  + result[0] +"</p>";
        record +="<p> Filename : "+ result[2]+"</p>";
        flink = result[3];
        record +="<p>File link : "  + "<a href=\"" + flink + "\"  download=\""+result[2]+"\">" + flink.trunc(70) + "</a></p>";
        record += "<br>";
        
        spanHistory.innerHTML = record + spanHistory.innerHTML;
    }); 

   
}

function watchHistoric () {
        
    histDiv = document.getElementById("history");
    histDiv.innerHTML = "";
    
    var line = document.createElement("h4");
    line.innerHTML = "My last transactions with account " + window.account;
    histDiv.appendChild(line);

    var spanHistory = document.createElement("span");
    histDiv.appendChild(spanHistory);
    
    publishEvents.watch(function(err, result) {
      if (err) {
        console.log(err)
        return;
      }
      //console.log(result.args.hash);
      addHistoryLine(spanHistory, result.args.hash);
    });
}



//function uploadFile() {
//
//    var form = new FormData();
//    form.append("file", window.currentFile);
//    var oReq = new XMLHttpRequest();
//    oReq.onreadystatechange = function () {
//        if (oReq.readyState == XMLHttpRequest.DONE) {
//            alert(oReq.responseText);
//        }
//    }
//    oReq.open("POST", "upload.php");
//    oReq.send(form);
//
//}

function transactionStatus(txid) {

    var startTime = Date.now();
    var counter = 0;
    var i = setInterval(function () {
        web3.eth.getTransactionReceipt(txid, function (error, result) {

            if (result != null) {
                clearInterval(i);
                clearStatus();
                setStatus("Transaction <a href=\"http://testnet.etherscan.io/tx/" + txid + "\"  target=\"_blank\">" + txid + "</a> validated");
                var hashfile = web3.toAscii(document.getElementById("hashValue").value);
                window.fileStorageContract.getHashRecord.call(hashfile, getHashRecordCallback);
                watchHistoric();
                
            } else {
                elapsedTime = Date.now() - startTime;
                clearStatus();
                setStatus("Successfully sent data. Transaction pending since " + Math.trunc(elapsedTime / 1000) + " seconds");
            }
        });


        counter++;

    }, 1000);

}


function documentRegisterCallback(err, result) {

    if (result == true) {
        setStatus("This file has already been certified");
    } else {

        var elem = document.getElementById("hashValue");
        var hashFile = web3.toAscii(elem.value);
        var fname = document.getElementById("filename").value;
        var furl = document.getElementById("fileurl").value;
        window.fileStorageContract.publish.sendTransaction(hashFile, fname, furl, window.sendDataObject, function (err, result) {
            if (err) {
                setStatus("Error sending data: " + err);
            } else {
                window.currentData = data;
                setStatus("Successfully sent data. Transaction pending ...");              
                transactionStatus(result);
                
            }
        });
    }
}

function certifyDocument() {

    clearStatus();
    if (!window.fileStorageContract) {
        setStatus("Can't access to the smart contract, please install MetaMask");
        return;
    }

    var elem = document.getElementById("hashValue");
    var hashFile = elem.value;
    elem = document.getElementById("fileurl");
    var fileurl = elem.value;

    data = hashFile + fileurl;

    if (window.currentData == data) {
        setStatus("You will override your contract's data with the same data, no need ");
        return;
    }
    
    if(fileurl === "") {
        var r = confirm("Are you sure you want to register this document with no file link ?");
        if (!r) {
            return;
        }
    }
    window.fileStorageContract.documentExists.call(web3.toAscii(hashFile),documentRegisterCallback);	


}

function documentVerifyCallback(err, result) {

    if (result == false) {
        setStatus("This file is not certified");
    } else {
        setStatus("This file has been certified : ");
        var hashfile = web3.toAscii(document.getElementById("hashValue").value);
        window.fileStorageContract.getHashRecord.call(hashfile, getHashRecordCallback);
    }
}

function verifyDocument() {
    clearStatus();

    if (!window.fileStorageContract) {
        setStatus("Can't access to the smart contract, please install MetaMask");
        return;
    }

    var hashfile = web3.toAscii(document.getElementById("hashValue").value);
    window.fileStorageContract.documentExists.call(hashfile, documentVerifyCallback);


}

function arrayBufferToWordArray(ab) {
    var i8a = new Uint8Array(ab);
    var a = [];
    for (var i = 0; i < i8a.length; i += 4) {
        a.push(i8a[i] << 24 | i8a[i + 1] << 16 | i8a[i + 2] << 8 | i8a[i + 3]);
    }
    return CryptoJS.lib.WordArray.create(a, i8a.length);
}


function computeHashFromFile(f) {

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onloadend = (function (theFile) {
        return function (e) {
            var arrayBuffer = e.target.result;

            var hash = CryptoJS.SHA256(arrayBufferToWordArray(arrayBuffer));
            hash = CryptoJS.enc.Hex.stringify(hash);
            //hash = CryptoJS.enc.Base64.stringify(hash).substring(0,31);
            //hash = hash.toString(CryptoJS.enc.Base64);
            document.getElementById("computingHash").style.display = 'none';
            document.getElementById("hashDiv").style.display = 'block';
            document.getElementById("fileDataDiv").style.display = 'block';
            document.getElementById("fileNameDiv").style.display = 'block';
            document.getElementById("verify").disabled = false;
            document.getElementById("certify").disabled = false;
            var elem = document.getElementById("hashValue");
            elem.value = hash;
            document.getElementById("filename").value = theFile.name;
            window.currentFile = theFile;

        };

    })(f);
    reader.onerror = function (e) {
        console.error(e);
    };



    // Read in the image file as a data URL.
    reader.readAsArrayBuffer(f);
    window.currentFile = f;

}

function computeHashFromURL(urlDL, urlShare) {


    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var b = new Blob([xhr.response]);
            var filename = urlDL.substring(urlDL.lastIndexOf("/") + 1).split("?")[0];
            b.name = filename;                        
            computeHashFromFile(b);
            document.getElementById("fileurl").value = urlShare;
        }
    }
    xhr.open("GET", urlDL, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();

}


function onSelectChange() {
    resetForm();
    
    var selectedValue = document.getElementById("fileType").value;
    var upload = selectedValue == "1";
    if (upload) {
        document.getElementById("uploadDiv").style.display = 'block';
        document.getElementById("urlDiv").style.display = 'none';
    } else {
        document.getElementById("uploadDiv").style.display = 'none';
        document.getElementById("urlDiv").style.display = 'block';


    }
}

function onFileSelected() {
        
    file = document.getElementById("upload").files[0];
    if (file) {
        document.getElementById("computingHash").style.display = 'block';
        computeHashFromFile(file);

    }
}

function onURLchanged() {
    
    
    urlShare = document.getElementById("givenurl").value;
    urlDL = urlShare.replace("www.dropbox.com", "dl.dropboxusercontent.com");
    if (urlShare) {
        document.getElementById("computingHash").style.display = 'block';
        computeHashFromURL(urlDL, urlShare);

    }
}

function resetForm() {

    document.getElementById("upload").value = "";
    document.getElementById("givenurl").value = "";

    document.getElementById("hashValue").value = "";
    document.getElementById("fileurl").value = "";

    document.getElementById("hashDiv").style.display = 'none';
    document.getElementById("fileDataDiv").style.display = 'none';
    document.getElementById("fileNameDiv").style.display = 'none';
    
    document.getElementById("verify").disabled = true;
    document.getElementById("certify").disabled = true;
    
    clearStatus();

}





function addFileURL(url) {

    window.ipfs.util.addFromURL(url, function (err, result) {
        if (err) {
            console.error('Error sending file: ', err);
            return null;
        } else {
            console.log(result);
            var IPFSurl = ipfsDataHost + "/" + result[0].hash;
            console.log(IPFSurl);
        }
    });
}

function uploadToIPFS() {

    document.getElementById("fileurl").value = "Wait while uploading "+ window.currentFile.name ;
    reader = new FileReader()
    reader.onload = function () {
        var toStore =  ipfs.Buffer(reader.result);
        ipfs.add(toStore, function (err, res) {
            if (err || !res) {
                return console.error('ipfs add error', err, res)
            }

            var IPFSurl = ipfsDataHost + "/" + res[0].hash;
            document.getElementById("fileurl").value = IPFSurl;            
        })
    }
    reader.readAsArrayBuffer(window.currentFile)

}

function downloadFromIPFS(hash) {
    ipfs.cat(hash, function (err, res) {
    if (err || !res) {
      return console.error('ipfs cat error', err, res)
    }
    if (res.readable) {
      console.error('unhandled: cat result is a pipe', res)
    } else {
     
      document.getElementById('fileurl').innerText = res
    }
  })
}


function sendMail () {
    }


var options_load = {
    // Required. Called when a user selects an item in the Chooser.
    success: function (files) {
        document.getElementById("givenurl").value = files[0].link;
        onURLchanged();
    },
    // Optional. Called when the user closes the dialog without selecting a file
    // and does not include any parameters.
    cancel: function () {

    },
    // Optional. "preview" (default) is a preview link to the document for sharing,
    // "direct" is an expiring link to download the contents of the file. For more
    // information about link types, see Link types below.
    linkType: "preview", // or "direct"

    // Optional. A value of false (default) limits selection to a single file, while
    // true enables multiple file selection.
    multiselect: false, // or true


};

var button = Dropbox.createChooseButton(options_load);
document.getElementById("cloud_file2").appendChild(button);

watchHistoric ();




