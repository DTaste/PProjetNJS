var pioStorageURL = "http://104.155.80.221:3000";
var impactCategories = ["Climate Mitigation","Adaptation to Climate Change","Water & Soil","Energy & Ressources","Wastes","Economic","Corporate","Social & Communities","Society"];

function getDownloadURL(hash, filename) {
    return pioStorageURL + "/download?h=" + hash + "&n=" + encodeURIComponent(filename);

}

window.addEventListener('load', function () {

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
//    if (typeof web3 !== 'undefined') {
//        // Use Mist/MetaMask's provider
//        web3 = new Web3(web3.currentProvider);
//
//    } else {
    web3 = new Web3(new Web3.providers.HttpProvider("https://morden.infura.io/yrWceYoyF37gvs5bwHzE"));
//    }

    // Now you can start your app & access web3 freely:
    startApp();

})

function startApp() {
    window.web3 = web3;
    window.fileStorageContract = web3.eth.contract(contractAbi).at(contractAddress);
    registerEvents = window.fileStorageContract.RegisterEvent({}, {fromBlock: 0, toBlock: 'latest'});
    var count = 1;
    registerEvents.watch(function (err, result) {
        if (err) {
            console.log(err)
            return;
        }
        addTableLine(count, result);
        count++;
    });

}

function addTableLine(count, resultWatch) {

    result = window.fileStorageContract.getClaim.call(resultWatch.args._hash);//, function (err, result) {
    rowData = "<th>IPI</th>";
    rowData += "<td>" + impactCategories[result[4]] + "</td>";
    rowData += "<td>" + result[2] + "</td>";
    
    author = window.fileStorageContract.getPartnerAdressData.call(result[0]);
    rowData += "<td>" + author[0] + "</td>";
    
    partners = result[5];
    partnerString = "";
    for (i=0; i<partners.length; i++) {
        partnerData = window.fileStorageContract.getPartnerAdressData.call(partners[i]);
        partnerString += "<li>"+ partnerData[0];
    }
    rowData += "<td>" + partnerString + "</td>";
    
    rowData += "<td>" + new Date(result[1] * 1000) + "</td>";
    hashFile = resultWatch.args._hash;
    hashFile = hashFile.substr(2);
    rowData += "<td><a href=\"" + getDownloadURL(hashFile ,result[3]) + "\"> Download </a></td>";
    rowData += "<td><a href=\"http://testnet.etherscan.io/tx/" + resultWatch.transactionHash + "\"  target=\"_blank\"> Block </a></td>";
    // $('#row'+count).append(rowData);
    //newLine = "<tr id=\"row"+count+"\"></tr>";
    $('#claimTable').prepend("<tr>" + rowData + "</tr>");
    //});
}