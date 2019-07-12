const AssetsFactory = artifacts.require("AssetsFactory");
const RoobeeAsset = artifacts.require("RoobeeAsset");
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider('http://localhost:7545');
const web3 = new Web3(provider);
const truffleAssert = require('truffle-assertions');


contract("AssetsFactoryTest", async accounts => {

    it("should issue new type of asset", async () => {
            let factory = await AssetsFactory.deployed();
            await factory.issueNewAsset("Test", "TTT", 1);
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            let name = await asset.name.call();
            let symbol = await asset.symbol.call();
            let owner = await asset.owner.call();
            assert.equal(name, "Test");
            assert.equal(symbol, "TTT");
            assert.equal(owner, factory.address);
    });

    it("should add auditor", async () => {
            let factory = await AssetsFactory.deployed();
            await factory.addAuditor(accounts[1]);
            let isAuditor = await factory.auditors.call(accounts[1]);
            assert(isAuditor);
        }
    )

    it("should increase amount ", async () => {
            let factory = await AssetsFactory.deployed();
            var assetID = 1;
            var amount = 100;
            var nonce = 1;
            var hash = web3.utils.soliditySha3(assetID,amount,nonce);
            var signature = await web3.eth.sign(hash, accounts[1]);
            await factory.increaseAmount(assetID, amount, nonce,signature);
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            let assetsAmount = await asset.totalSupply.call();
            assert.equal(amount, assetsAmount);
        }
    )

    it("should revert with nonce allready used", async () => {
            let factory = await AssetsFactory.deployed();
            var assetID = 1;
            var amount = 1;
            var nonce = 1;
            var hash = web3.utils.soliditySha3(assetID,amount,nonce);
            var signature = await web3.eth.sign(hash, accounts[1]);
            await truffleAssert.reverts(factory.increaseAmount(assetID, amount, nonce,signature), "nonce allready used");
        }
    )

    it("should revert with nonAuditors signature", async () => {
            let factory = await AssetsFactory.deployed();
            var assetID = 1;
            var amount = 100;
            var nonce = 3;
            var hash = web3.utils.soliditySha3(assetID,amount,nonce);
            var signature = await web3.eth.sign(hash, accounts[0]);
            await truffleAssert.reverts(factory.increaseAmount(assetID, amount, nonce,signature), "nonAuditors signature");
        }
    )

    it("should revert with Ownable: caller is not the owner", async () => {
            let factory = await AssetsFactory.deployed();
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            await  truffleAssert.reverts(asset.thisAssignTo(accounts[1],1));
        }
    )

    it("should assign tokens to account1", async () => {
            let factory = await AssetsFactory.deployed();
            var assetID = 1;
            var amount = 10;
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            await factory.assignAsset(assetID, accounts[1], amount);
            console.log(1);
            let accountsBalance = await asset.balanceOf.call(accounts[1]);
            assert.equal(amount, accountsBalance);
        }
    )

    it("should redeem account1's tokens", async () => {
            let factory = await AssetsFactory.deployed();
            var assetID = 1;
            var amount = 1;
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            let balanceBefore = await asset.balanceOf.call(accounts[1]);
            await factory.redeemAssetFrom(assetID, accounts[1], amount);
            let balanceAfter = await asset.balanceOf.call(accounts[1]);
            assert.equal(balanceAfter, balanceBefore - amount);
        }
    )

    it("should burn account1's tokens", async () => {
            let factory = await AssetsFactory.deployed();
            var assetID = 1;
            var amount = 1;
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            let balanceBefore = await asset.balanceOf.call(accounts[1]);
            let totalSupplyBefore =  await asset.totalSupply.call();
            await factory.burnAssetFrom(assetID, accounts[1], amount);
            let balanceAfter = await asset.balanceOf.call(accounts[1]);
            let totalSupplyAfter =  await asset.totalSupply.call();
            assert.equal(balanceAfter, balanceBefore - amount);
            assert.equal(totalSupplyAfter, totalSupplyBefore - amount);
        }
    )

    it("should burn our tokens", async () => {
            let factory = await AssetsFactory.deployed();
            var assetID = 1;
            var amount = 1;
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            let balanceBefore = await asset.balanceOf.call(AssetAddress);
            await factory.burnAsset(assetID, amount);
            let balanceAfter = await asset.balanceOf.call(AssetAddress);
            assert.equal(balanceAfter, balanceBefore - amount);
        }
    )

    it("should revert all with Ownable: caller is not the owner", async () => {
            let factory = await AssetsFactory.deployed();
            var amount = 1;
            let AssetAddress = await factory.getAssetsAddress.call(1);
            let asset = await RoobeeAsset.at(AssetAddress);
            await  truffleAssert.reverts(asset.thisBurn(amount));
            await  truffleAssert.reverts(asset.thisBurnFrom(accounts[1],amount));
            await  truffleAssert.reverts(asset.mint(amount));
        }
    )
});