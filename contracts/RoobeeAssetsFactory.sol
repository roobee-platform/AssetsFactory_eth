pragma solidity ^0.5.0;
import "./IERC20.sol";
import "./RoobeeAsset.sol";


contract AssetsFactory is Ownable {

    mapping (uint256 => address) private assets;
    mapping (address => bool) public auditors;
    mapping(address => mapping(uint256 => bool)) public seenNonces;

    constructor() public {

    }

    //only for testing mechanic
    function addAuditor(address _auditor) public onlyOwner {
        auditors[_auditor] = true;
    }

    function getAssetsAddress(uint256 assetID) public view returns(address) {
        return assets[id];
    }

    function transferAsset(uint256 assetID, address _to, uint256 _value) onlyOwner public {
        RoobeeAsset(assets[assetID]).transfer(_to, _value);
    }

    function transferAssetFrom(uint256 assetID, address _from, address _to, uint256 _value) onlyOwner public {
        RoobeeAsset(assets[assetID]).transferFrom(_from, _to, _value);
    }

    function assignAsset(uint256 assetID, address _to, uint256 _value) onlyOwner public {
        RoobeeAsset(assets[assetID]).assignTo(_to, _value);
    }

    event AssetIssued(address assetAddress, uint256 assetID);

    function issueNewAsset(string memory _name, string memory _symbol, uint256 assetID) onlyOwner public returns(address) {
        RoobeeAsset newAsset = new RoobeeAsset(_name, _symbol);
        require(assets[assetID] == address(0), "assetID allready used");
        assets[assetID] = address(newAsset);
        emit AssetIssued(address(newAsset), assetID);
        return address(newAsset);
    }

    function increaseAmount(uint256 assetID, uint256 amount, address _to, uint256 nonce, bytes memory signature ) onlyOwner public {
        require(checkApprove(assetID, amount, nonce, signature));
        RoobeeAsset(assets[assetID]).mint(_to, amount);
    }


    function checkApprove(uint256 assetID, uint256 amount, uint256 nonce, bytes memory signature) public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(assetID, amount, nonce));
        bytes32 messageHash = toEthSignedMessageHash(hash);
        address signer = recover(messageHash, signature);
        require(!seenNonces[signer][nonce], "nonce allready used");
        return(auditors[signer]);
    }


    function recover(bytes32 hash, bytes memory signature)
    internal
    pure
    returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Check the signature length
        if (signature.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables with inline assembly.
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            // solium-disable-next-line arg-overflow
            return ecrecover(hash, v, r, s);
        }
    }

    /**
      * toEthSignedMessageHash
      * @dev prefix a bytes32 value with "\x19Ethereum Signed Message:"
      * and hash the result
      */
    function toEthSignedMessageHash(bytes32 hash)
    internal
    pure
    returns (bytes32)
    {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
    }

}
