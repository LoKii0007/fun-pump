// SPDX-License-Identifier: UNLICENSED
pragma solidity >0.8.0 <0.9.0;
import {Token} from "./Token.sol";

contract Factory {
    uint256 public immutable platformFee;
    uint256 public totalTokens;

    address public owner;
    address[] public tokens;
    mapping(address => TokenSale) public tokenToSale;

    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }

    event Created(address indexed token);

    constructor(uint256 _platformFee) {
        platformFee = _platformFee;
        owner = msg.sender;
    }

    function getTokenSale(
        uint256 _index
    ) public view returns (TokenSale memory) {
        return tokenToSale[tokens[_index]];
    }

    function create(
        string memory _name,
        string memory _symbol
    ) external payable {
        //? male sure that the fee is correct
        require(msg.value >= platformFee, "Factory: creator fee not met");

        //? create a new token
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000 ether);

        //? save the token for later use
        tokens.push(address(token));
        totalTokens++;

        //? list the token for sale
        TokenSale memory sale = TokenSale(
            address(token),
            _name,
            msg.sender,
            0,
            0,
            true
        );

        tokenToSale[address(token)] = sale;

        //? tell people its live
        emit Created(address(token));
    }

    function buy(address _token, uint256 _amount) external payable {
        Token(_token).transfer(msg.sender, _amount);
    }
}
