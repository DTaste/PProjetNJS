var pioStorageURL = "http://104.155.80.221:3000";
var impactCategories = ["Climate Mitigation","Adaptation to Climate Change","Water & Soil","Energy & Ressources","Wastes","Economic","Corporate","Social & Communities","Society"];

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

    } else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://morden.infura.io/yrWceYoyF37gvs5bwHzE"));
    }

    // Now you can start your app & access web3 freely:
    startApp();

})

function startApp() {
    window.web3 = web3;
    window.fileStorageContract = web3.eth.contract(contractAbi).at(contractAddress);
    
    givenhash = "0x" + getURLArg("h");
    //givenhash = getURLArg("h");
    
    console.log(givenhash);
    
    registerEvents = window.fileStorageContract.RegisterEvent({_hash: givenhash}, {fromBlock: 0, toBlock: 'latest'});
    
    window.fileStorageContract.getClaim(givenhash, function (err, result) {
          
          console.log(result);
          $('#timestamp').append("Date of transaction : " +  new Date(result[1] * 1000));
          
          window.fileStorageContract.getPartnerAdressData.call(result[0], function (err, result) {
             author =  result[0];
             $('#senderAdress').append("Registered by :" +  author);
          });
          
          $('#senderAdress').append("Author account :" +  result[0]);
          
          $('#projectCategory').append("Impact category : " +impactCategories[result[4]]);
          $('#projectDescription').append("Project description : " +result[2]);
                
        

//            partners = result[5];
//            partnerString = "";
//            for (i=0; i<partners.length; i++) {
//                partnerData = window.fileStorageContract.getPartnerAdressData.call(partners[i]);
//                partnerString += "<li>"+ partnerData[0];
//            }
        
        hashFile = givenhash;
        hashFile = hashFile.substr(2);
        $('#fileDownload').append("<a href=\"" + getDownloadURL(hashFile ,result[3]) + "\"> Download file</a>");
    });
    
    
    registerEvents.watch(function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        $('#transactionid').append("Transaction hash : ");
        $('#transactionid').append("<a href=\"http://testnet.etherscan.io/tx/" + resultWatch.transactionHash + "\"  target=\"_blank\">"+ resultWatch.transactionHash +" </a>");
    });

}
