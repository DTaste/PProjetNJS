var pioStorageURL = "http://104.155.80.221:3000";
var impactCategories = ["Climate Mitigation", "Adaptation to Climate Change", "Water & Soil", "Energy & Ressources", "Wastes", "Economic", "Corporate", "Social & Communities", "Society"];

function getDownloadURL(hash, filename) {
    return pioStorageURL + "/download?h=" + hash + "&n=" + encodeURIComponent(filename);

}

function getURLArg(param) {
    var vars = {};
    window.location.href.replace(location.hash, '').replace(
            /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
            function (m, key, value) { // callback
                vars[key] = value !== undefined ? value : '';
            }
    );

    if (param) {
        return vars[param] ? vars[param] : null;
    }
    return vars;
}

window.addEventListener('load', function () {

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        web3 = new Web3(web3.currentProvider);
        window.account = web3.eth.accounts[0];
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://morden.infura.io/yrWceYoyF37gvs5bwHzE"));
        window.account = 0;
    }

    // Now you can start your app & access web3 freely:
    startApp();

})

function startApp() {
    window.web3 = web3;
    window.fileStorageContract = web3.eth.contract(contractAbi).at(contractAddress);

    window.givenhash = "0x" + getURLArg("h");
    //givenhash = getURLArg("h");





    window.fileStorageContract.getClaim(window.givenhash, function (err, result) {
        console.log(result[0]);
        if (err || result === null || result[0] == 0x0) {
            $('#claimFound').append('<h2><i class="fa fa-frown-o" aria-hidden="true"></i> Claim not found on blockchain</h2>');
        } else {
            $('#claimFound').append('<h2><i class="fa fa-check-square-o"" aria-hidden="true"></i> Claim found on blockchain</h2>');

            $('#claimFound').append("<h4>This page contains information about digitally signed claim embedded in the blockchain.</h4>");


            $('#timestamp').append("<b>Date of transaction: </b>" + new Date(result[1] * 1000));

           
            var authorAccount = result[0];
            window.fileStorageContract.getPartnerAdressData.call(authorAccount, function (err, result) {
                author = result[0];
                $('#senderAdress').append("<b>Author account: </b>\"" + author + "\"");
                $('#senderAdress').append("\t (" + authorAccount +")" );
            });



            $('#projectCategory').append("<b>Impact category: </b>" + impactCategories[result[4]]);
            $('#projectDescription').append("<b>Project description: </b>" + result[2] );

            $('#signedBy').append("<b>Signed by : </b>");

//            partners = result[5];
//            partnerString = "";
//            for (i=0; i<partners.length; i++) {
//                partnerData = window.fileStorageContract.getPartnerAdressData.call(partners[i]);
//                partnerString += "<li>"+ partnerData[0];
//            }

            hashFile = window.givenhash;
            hashFile = hashFile.substr(2);
            $('#fileDownload').append("<a href=\"" + getDownloadURL(hashFile, result[3]) + "\"> <b>Download file</b></a>");
        }
    });

   
    console.log(window.givenhash);
    registerEvents = window.fileStorageContract.RegisterEvent({}, {fromBlock: 0, toBlock: 'latest'});
    registerEvents.watch(function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(result);
        if(result.args._hash === window.givenhash) {
            $('#transactionid').append("<b>Transaction hash : </b>");
            $('#transactionid').append("<a href=\"http://testnet.etherscan.io/tx/" + result.transactionHash + "\"  target=\"_blank\">" + result.transactionHash + " </a>");
       }
    });

  
    signedEvents = window.fileStorageContract.SignEvent({}, {fromBlock: 0, toBlock: 'latest'});
    signedEvents.watch(function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        if(result.args._hash === window.givenhash) {   
            
             window.fileStorageContract.getPartnerAdressData.call(result.args._partner, function (err, result) {
                 $('#signedBy').append('<div><b>' + result[0] + '</b></div>');
             });               
            
            
            if(window.account != 0 && result.args._partner === window.account) {
                $('#signatureFound').html('<h4><i class="fa fa-pencil-square-o" aria-hidden="true"></i> You have signed this claim</h4>');
                $('#sign').prop('disabled', true);
                $('#sign').hide();
            }
        }

    });


}


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



                    if (confirmationStartTime === -1)
                        confirmationStartTime = Date.now();

                    elapsedTime = Date.now() - confirmationStartTime;
                    $('#status').html('<p>Transaction <a href="http://testnet.etherscan.io/tx/' + txid + '"  target="_blank">' + txid + '</a> validated');
                    $('#status').append('<p>Waiting transaction confirmation since ' + Math.trunc(elapsedTime / 1000) + ' seconds</p>');


                } else if (result !== null) {

                    clearInterval(i);
                    $('#status').html('<p>Claim signed ! Transaction <a href="http://testnet.etherscan.io/tx/' + txid + '  target="_blank">' + txid + '</a> confirmed</p>');

                } else {

                    elapsedTime = Date.now() - startTime;
                    clearStatus();
                    $('#status').html('<p>Claim signing. Transaction pending since ' + Math.trunc(elapsedTime / 1000) + ' seconds</p>');
                }
            }
        });


        counter++;

    }, 2000);

}




$('#sign').click(function () {
    window.fileStorageContract.signClaim.sendTransaction(window.givenhash, function (err, result) {
        if (err) {
            $('#status').append("<p>Error while signing !</p>");
        } else {
            $('#status').append("<p>Claim signing. Transaction pending ... </p>")
            transactionStatus(result);

        }

    });
});
