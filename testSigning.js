const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:7545')
const web3 = new Web3(provider)
async function f1(assetID, amount, nonce) {
    var hash = web3.utils.soliditySha3(assetID,amount,nonce);
    console.log(hash)
    var signature = await web3.eth.sign(hash, "0xcF583aAd58a7210c0E1F716226490B0b74E81C80");
    console.log(signature); // 10
}
f1('2','3', '2')


