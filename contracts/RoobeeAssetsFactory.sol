pragma solidity ^0.5.0;
import "./IERC20.sol";
import "./RoobeeAsset.sol";


contract AssetsFactory {

    mapping (uint256 => address) public assets;
    mapping (address => bool) public auditors;
    mapping(address => mapping(uint256 => bool)) public seenNonces;

    constructor(/*address _auditor*/) public {
        //auditors[_auditor] = true;
    }

    event AssetIssued(address assetAddress, uint256 assetID);

    function issueNewAsset(string memory _name, string memory _symbol, uint256 assetID) public returns(address) {
        RoobeeAsset newAsset = new RoobeeAsset(_name, _symbol);
        require(!assets[assetID], "assetID allready used");
        assets[assetID] = address(newAsset);
        emit AssetIssued(address(newAsset), assetID);
        return address(newAsset);
    }

    function increaseAmount(uint256 assetID, uint256 amount, address _to) public {
        RoobeeAsset(assets[assetID]).mint(_to, amount);
    }


    function checkApprove(uint256 owner, uint256 amount, uint256 nonce, bytes memory signature) public returns (bool) {
        // This recreates the message hash that was signed on the client.
        bytes32 hash = keccak256(abi.encodePacked(owner, amount, nonce));
        bytes32 messageHash = toEthSignedMessageHash(hash);
        // Verify that the message's signer is the owner of the order
        address signer = recover(messageHash, signature);
        require(!seenNonces[signer][nonce], "nonce allready used");
        seenNonces[signer][nonce] = true;
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
