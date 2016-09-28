var pioStorageURL = "http://104.155.80.221:3000";

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
    rowData += "<td>" + result[2] + "</td>";
    partner = window.fileStorageContract.getPartnerAdressData.call(result[0]);
    rowData += "<td>" + partner[0] + "</td>";
    rowData += "<td>" + result[4] + "</td>";
    rowData += "<td>" + new Date(result[1] * 1000) + "</td>";
    rowData += "<td><a href=\"" + pioStorageURL + "/" + resultWatch.args._hash + "\"  download=\"" + result[2] + "\"> Download </a></td>";
    rowData += "<td><a href=\"http://testnet.etherscan.io/tx/" + resultWatch.transactionHash + "\"  target=\"_blank\"> Block </a></td>";
    // $('#row'+count).append(rowData);
    //newLine = "<tr id=\"row"+count+"\"></tr>";
    $('#claimTable').append("<tr>" + rowData + "</tr>");
    //});
}