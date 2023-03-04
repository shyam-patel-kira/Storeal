// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Storage is AccessControl {
    bytes32 public constant ADMIN_WRITE_ROLE = keccak256("ADMIN_WRITE_ROLE");
    bytes32 public constant ADMIN_READ_ROLE = keccak256("ADMIN_READ_ROLE");

    struct User {
        address userAddress;
        string name;
        string country;
    }
    User user;

    struct Data {
        uint uuid;
        string cidraw;
        // address owner;
    }
    Data [] dataArray;

    mapping(address => Data[]) addressToData;
    mapping(address => User[]) userMapping;

    constructor() {
        _setupRole(ADMIN_READ_ROLE, msg.sender);
        _setupRole(ADMIN_WRITE_ROLE, msg.sender);
    }

    function grantRoleAdminWrite(address _address) external onlyRole(ADMIN_WRITE_ROLE) {
        _grantRole(ADMIN_WRITE_ROLE, _address);
    }
    function grantRoleAdminRead(address _address) external onlyRole(ADMIN_READ_ROLE) {
        _grantRole(ADMIN_READ_ROLE, _address);
    }

    function writeData(uint _uuid, string memory _cidraw) public {
        require(hasRole(ADMIN_WRITE_ROLE, msg.sender), "Must have admin role to set data");
        Data memory dataArrayTemp = Data(_uuid, _cidraw);
        dataArray.push(dataArrayTemp);
        addressToData[msg.sender].push(dataArrayTemp);
    }

    function readData(address _address) public view returns (Data [] memory) {
        require(hasRole(ADMIN_READ_ROLE, msg.sender), "Must have admin role to set data");
        return addressToData[_address];
    }
}