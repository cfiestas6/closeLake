// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @author Carlos :)
 * @notice This is a basic NFT contract for testing the NFT Marketplace.
 * @dev ERC721 from Openzeppelin and the NFT is uploaded in IPFS
 */

contract BasicNFT is ERC721 {
    string public constant TOKEN_URI =
        "ipfs://QmRmC5gLu9TxXWgd6x7rqDvqT35j1eN743hEcU1MoZ51eE";
    uint256 private s_tokenCounter;

    event PictureMinted(uint256 indexed tokenId);

    constructor() ERC721("Dogie", "DOG") {
        s_tokenCounter = 0;
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokenCounter);
        emit PictureMinted(s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}