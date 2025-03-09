// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract NSPOINTS is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    mapping(address => bool) private _allowedTransfers;

    event AllowedTransferAddressAdded(address indexed account);
    event AllowedTransferAddressRemoved(address indexed account);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC20_init("NSDEVPOINTS", "NSDEV");
        __Ownable_init(msg.sender);

        _allowedTransfers[msg.sender] = true;
        emit AllowedTransferAddressAdded(msg.sender);
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        require(
            _allowedTransfers[msg.sender],
            "NSPOINTS: sender not allowed to transfer"
        );
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        require(
            _allowedTransfers[msg.sender],
            "NSPOINTS: sender not allowed to transfer"
        );
        return super.transferFrom(sender, recipient, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function addAllowedTransferAddress(address account) external onlyOwner {
        _allowedTransfers[account] = true;
        emit AllowedTransferAddressAdded(account);
    }

    function removeAllowedTransferAddress(address account) external onlyOwner {
        _allowedTransfers[account] = false;
        emit AllowedTransferAddressRemoved(account);
    }

    function isAllowedTransferAddress(
        address account
    ) external view returns (bool) {
        return _allowedTransfers[account];
    }
}
