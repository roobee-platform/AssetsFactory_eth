var Factory = artifacts.require("AssetsFactory");
module.exports = function(deployer) {
    // deploy HumansToken
    deployer.deploy(Factory)
};