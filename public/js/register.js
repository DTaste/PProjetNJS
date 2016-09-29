var pioStorageURL = "http://104.155.80.221:3000";

var impactCategories = ["Climate Mitigation", "Adaptation to Climate Change", "Water & Soil", "Energy & Ressources", "Wastes", "Economic", "Corporate", "Social & Communities", "Society"];
var sel = document.getElementById('claimType');
for (var i = 0; i < impactCategories.length; i++) {
    var opt = document.createElement('option');
    opt.innerHTML = impactCategories[i];
    opt.value = i;
    sel.appendChild(opt);
}


function getDownloadURL(hash, filename) {
    return pioStorageURL + "/download?h=" + hash + "&n=" + encodeURIComponent(filename);

}



window.addEventListener('load', function () {

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        web3 = new Web3(web3.currentProvider);

    } else {
        document.getElementById("noMetamask").style.display = 'block';
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    // Now you can start your app & access web3 freely:
    startApp();

})


function startApp() {
    window.web3 = web3;
    window.account = web3.eth.accounts[0];
    window.fileStorageContract = web3.eth.contract(contractAbi).at(contractAddress);
    window.currentFile = 0;
    window.sendDataObject = {
        from: account,
        gas: 300000,
    };
    window.fileStorageContract.getPartnersNumber(function (err, result) {
        if (err) {
            setStatus('Error calling smart contract');
        } else if (result) {  
            
            fillPartnerList(result.c[0]);
        }
    });

}

function fillPartnerList(nbPartner) {
    
    console.log("Nb = " +nbPartner);
    for (var i = 0; i < nbPartner; i++) {

        window.fileStorageContract.getPartnerIndexData(i, function (err, result) {
           
            $("#partnerSelect").append(// Append an object to the inside of the select box
                    $("<option></option>")
                    .text(result[1])
                    .val(result[0])
                    .data('mail', result[2])
                    );
            
//            if(i === nbPartner) {
//                
//                $("#partnerSelect").multiselect({
//                    columns: 4,
//                    placeholder: 'Select options'
//                });
//            }
        });
    }
    
  

}



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


function transactionStatus(txid) {

    var startTime = Date.now();
    var confirmationStartTime = -1;
    var counter = 0;
    var i = setInterval(function () {
        window.web3.eth.getTransaction(txid, function (error, result) {

            if (error !== null) {
                console.log(error);
            } else {
                if (result !== null && result.blockNumber === null) {
                    //console.log(result);

                    clearStatus();

                    if (confirmationStartTime === -1)
                        confirmationStartTime = Date.now();

                    elapsedTime = Date.now() - confirmationStartTime;
                    setStatus("Transaction <a href=\"http://testnet.etherscan.io/tx/" + txid + "\"  target=\"_blank\">" + txid + "</a> validated");
                    setStatus("Waiting transaction confirmation since " + Math.trunc(elapsedTime / 1000) + " seconds");


                } else if (result !== null) {
                    clearStatus();
                    clearInterval(i);
                    setStatus("Transaction <a href=\"http://testnet.etherscan.io/tx/" + txid + "\"  target=\"_blank\">" + txid + "</a> confirmed");
                    var hashfile = window.web3.toAscii(document.getElementById("hashValue").value);
                    window.fileStorageContract.getClaim.call(hashfile, getHashRecordCallback);
                } else {

                    elapsedTime = Date.now() - startTime;
                    clearStatus();
                    setStatus("Successfully sent data. Transaction pending since " + Math.trunc(elapsedTime / 1000) + " seconds");
                }
            }
        });


        counter++;

    }, 2000);

}


function documentRegisterCallback(err, result) {

    if (result === true) {
        setStatus("This file has already been certified");
    } else {

        var hashFile = window.web3.toAscii($('#hashValue').val());
        var cname = $('#claimName').val();
        var ctype = "" + $('#claimType').val();
        var partners = $("#partnerSelect").val();

        window.fileStorageContract.register.sendTransaction(hashFile, cname, window.currentFile.name, ctype, partners, window.sendDataObject, function (err, res) {
            if (err) {
                setStatus("Error sending data: " + err);
            } else {

                setStatus("Successfully sent data. Transaction pending ...");
                transactionStatus(res);

            }
        });
    }
}


function getHashRecordCallback(err, result) {
    if (err) {
        setStatus('Error calling smart contract');
    } else if (result) {
        console.log(result);
        setStatus("Publisher : " + result[0]);
        setStatus("Timestamp : " + new Date(result[1] * 1000));
        setStatus("Project name : " + result[2]);

        setStatus("Impacts categories : " + impactCategories[result[4]]);
        setStatus("File : <a href=\"" + getDownloadURL($('#hashValue').val(), result[3]) + "\"> Download </a>");


        //setStatus("Block : #" + result[4] + "<a href=\"http://testnet.etherscan.io/block/" + result[4] + "\"  target=\"_blank\"> See in Etherscan </a>");

    } else {
        setStatus('No data found');
    }

}

function documentVerifyCallback(err, result) {

    if (result == false) {
        setStatus("This file is not certified");
    } else {
        setStatus("This file has been certified : ");
        var hashfile = web3.toAscii(document.getElementById("hashValue").value);
        window.fileStorageContract.getClaim.call(hashfile, getHashRecordCallback);
    }
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
            $('#computingHash').css({'display': 'none'}); //progress bar ?
            $('#hashDiv').css({'display': 'block'});
            $('#fileNameDiv').css({'display': 'block'});
            $('#claimTypeDiv').css({'display': 'block'});
            $('#partnerDiv').css({'display': 'block'});


            $('#verify').prop('disabled', false);
            $('#register').prop('disabled', false);

            $('#hashValue').val(hash);
            $('#claimName').val(theFile.name);


        };

    })(f);
    reader.onerror = function (e) {
        console.error(e);
    };



    // Read in the image file as a data URL.
    reader.readAsArrayBuffer(f);
}



function newForm() {
    window.currentFile = 0;
    $('#upload-input').prop('disabled', false);
    $('#upload-input').val("");
    $('#hashValue').val("");
    $('#claimName').val("");
    $('#claimType').val(0);

    $('#computingHash').css({'display': 'none'});
    $('#hashDiv').css({'display': 'none'});
    $('#fileNameDiv').css({'display': 'none'});
    $('#claimTypeDiv').css({'display': 'none'});
    $('#partnerDiv').css({'display': 'none'});


    $('#verify').prop('disabled', true);
    $('#register').prop('disabled', true);
    $('#invite').prop('disabled', true);

    clearStatus();
}

function sendMail() {
}

function uploadFile(hashFile) {
    var files = $('#upload-input').get(0).files;

    if (files.length > 0) {

        // create a FormData object which will be sent as the data payload in the
        // AJAX request
        var formData = new FormData();

        // loop through all the selected files and add them to the formData object
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            // add the files to formData object for the data payload
            formData.append('uploads[]', file, hashFile);
        }

        $.ajax({
            url: pioStorageURL + '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                console.log('upload successful!\n' + data);
            },
            xhr: function () {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();

                // listen to the 'progress' event
                xhr.upload.addEventListener('progress', function (evt) {

                    if (evt.lengthComputable) {
                        // calculate the percentage of upload completed
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);

                        // update the Bootstrap progress bar with the new percentage
                        $('.progress-bar').text(percentComplete + '%');
                        $('.progress-bar').width(percentComplete + '%');

                        // once the upload reaches 100%, set the progress bar text to done
                        if (percentComplete === 100) {
                            $('.progress-bar').html('File upload done');
                        }

                    }

                }, false);

                return xhr;
            }
        });

    }
}

$('#upload-input').on('change', function () {
    $('#upload-input').prop('disabled', true);
    var files = $(this).get(0).files;
    if (files.length > 0) {
        $('#computingHash').css({'display': 'block'});
        computeHashFromFile(files[0]);
        window.currentFile = files[0];
    } else {
        newForm();
    }
});



$('#verify').click(function () {
    clearStatus();

    if (!window.fileStorageContract) {
        setStatus("Can't access to the smart contract, please install MetaMask");
        return;
    }

    var hashfile = window.web3.toAscii($('#hashValue').val());
    window.fileStorageContract.claimExists.call(hashfile, documentVerifyCallback);


});

$('#register').click(function () {
    clearStatus();
    if (!window.fileStorageContract) {
        setStatus("Can't access to the smart contract, please install MetaMask");
        return;
    }

    var hashFile = $('#hashValue').val();

    uploadFile(hashFile);

//    var r = confirm("Are you sure you want to register this document with no file link ?");
//    if (!r) {
//            return;
//    }

    window.fileStorageContract.claimExists.call(web3.toAscii(hashFile), documentRegisterCallback);


});


$('#newClaimButton').click(function () {
    newForm();
});




