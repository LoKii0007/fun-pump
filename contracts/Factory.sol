// SPDX-License-Identifier: UNLICENSED
pragma solidity >0.8.0 <0.9.0;
import {Token} from "./Token.sol";

contract Factory {
    uint256 public immutable platformFee;
    uint256 public totalTokens;
    address public owner;
    address[] public tokens;

    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }
	mapping(address => TokenSale) public tokenToSale;

    constructor(uint256 _platformFee) {
        platformFee = _platformFee;
        owner = msg.sender;
    }

    function create(
        string memory _name,
        string memory _symbol
    ) external payable {
        // create a new token
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000 ether);

        // save the token for later use
        tokens.push(address(token));
        totalTokens++;

        // list the token for sale
        TokenSale memory sale = TokenSale(
            address(token),
            _name,
            msg.sender,
            0,
            0,
            true
        );
        // tell people its live
    }
}
