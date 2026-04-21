// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArcNameService {

    address public constant TREASURY = 0xd4806bdFD5b651AcD3f930717ce2c1c11b246Aa6;

    struct NameRecord {
        address owner;
        address resolver;
        uint256 expiry;
    }

    address public admin;
    mapping(string => NameRecord) private records;
    mapping(address => string) private primaryNames;

    uint256 public constant PRICE_SHORT  = 20 ether;
    uint256 public constant PRICE_MEDIUM = 5 ether;
    uint256 public constant PRICE_LONG   = 1 ether;

    event NameRegistered(string name, address indexed owner, uint256 expiry, uint256 feePaid);
    event NameRenewed(string name, uint256 newExpiry, uint256 feePaid);
    event NameTransferred(string name, address indexed from, address indexed to);
    event ResolverSet(string name, address resolver);
    event PrimaryNameSet(address indexed owner, string name);

    error Unauthorized();
    error NameTaken();
    error NameExpiredOrNotOwned();
    error InvalidName();
    error InvalidTLD();
    error InsufficientPayment(uint256 required, uint256 sent);
    error TreasuryTransferFailed();

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyNameOwner(string calldata _name) {
        NameRecord storage r = records[_name];
        if (r.owner != msg.sender || block.timestamp > r.expiry)
            revert NameExpiredOrNotOwned();
        _;
    }

    // ── READ ──────────────────────────────────────────────────

    function getOwner(string calldata _name) external view returns (address) {
        return records[_name].owner;
    }

    function getResolver(string calldata _name) external view returns (address) {
        return records[_name].resolver;
    }

    function getExpiry(string calldata _name) external view returns (uint256) {
        return records[_name].expiry;
    }

    function isAvailable(string calldata _name) external view returns (bool) {
        NameRecord storage r = records[_name];
        return r.owner == address(0) || block.timestamp > r.expiry;
    }

    function resolve(string calldata _name) external view returns (address) {
        NameRecord storage r = records[_name];
        if (block.timestamp > r.expiry) return address(0);
        return r.resolver != address(0) ? r.resolver : r.owner;
    }

    function reverseLookup(address _addr) external view returns (string memory) {
        return primaryNames[_addr];
    }

    function registrationFee(string calldata _name, uint256 _numYears)
        public pure returns (uint256)
    {
        string memory lbl = _extractLabel(_name);
        uint256 len = bytes(lbl).length;
        uint256 annual;
        if (len <= 3) {
            annual = PRICE_SHORT;
        } else if (len == 4) {
            annual = PRICE_MEDIUM;
        } else {
            annual = PRICE_LONG;
        }
        return annual * _numYears;
    }

    // ── WRITE ─────────────────────────────────────────────────

    function register(
        string calldata _name,
        address _owner,
        uint256 _numYears
    ) external payable {
        _validateName(_name);

        NameRecord storage r = records[_name];
        if (r.owner != address(0) && block.timestamp <= r.expiry)
            revert NameTaken();

        uint256 fee = registrationFee(_name, _numYears);
        if (msg.value < fee) revert InsufficientPayment(fee, msg.value);

        (bool sent, ) = payable(TREASURY).call{value: fee}("");
        if (!sent) revert TreasuryTransferFailed();

        uint256 exp = block.timestamp + (_numYears * 365 days);
        records[_name] = NameRecord({
            owner: _owner,
            resolver: _owner,
            expiry: exp
        });

        if (bytes(primaryNames[_owner]).length == 0) {
            primaryNames[_owner] = _name;
            emit PrimaryNameSet(_owner, _name);
        }

        emit NameRegistered(_name, _owner, exp, fee);

        if (msg.value > fee) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - fee}("");
            require(refunded, "Refund failed");
        }
    }

    function renew(string calldata _name, uint256 _numYears)
        external payable onlyNameOwner(_name)
    {
        uint256 fee = registrationFee(_name, _numYears);
        if (msg.value < fee) revert InsufficientPayment(fee, msg.value);

        (bool sent, ) = payable(TREASURY).call{value: fee}("");
        if (!sent) revert TreasuryTransferFailed();

        records[_name].expiry += _numYears * 365 days;
        emit NameRenewed(_name, records[_name].expiry, fee);

        if (msg.value > fee) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - fee}("");
            require(refunded, "Refund failed");
        }
    }

    function setResolver(string calldata _name, address _resolver)
        external onlyNameOwner(_name)
    {
        records[_name].resolver = _resolver;
        emit ResolverSet(_name, _resolver);
    }

    function setPrimaryName(string calldata _name) external {
        NameRecord storage r = records[_name];
        if (r.owner != msg.sender || block.timestamp > r.expiry)
            revert NameExpiredOrNotOwned();
        primaryNames[msg.sender] = _name;
        emit PrimaryNameSet(msg.sender, _name);
    }

    function transfer(string calldata _name, address _newOwner)
        external onlyNameOwner(_name)
    {
        address prev = records[_name].owner;
        records[_name].owner = _newOwner;
        records[_name].resolver = _newOwner;

        if (keccak256(bytes(primaryNames[prev])) == keccak256(bytes(_name))) {
            delete primaryNames[prev];
        }
        emit NameTransferred(_name, prev, _newOwner);
    }

    // ── ADMIN ─────────────────────────────────────────────────

    function adminRelease(string calldata _name) external onlyAdmin {
        require(block.timestamp > records[_name].expiry, "Not expired");
        delete records[_name];
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        admin = _newAdmin;
    }

    // ── INTERNAL ──────────────────────────────────────────────

    function _validateName(string calldata _name) internal pure {
        bytes memory nb = bytes(_name);
        if (nb.length < 5) revert InvalidName();

        bool validTLD = _hasSuffix(_name, ".arc")
                     || _hasSuffix(_name, ".agent")
                     || _hasSuffix(_name, ".usdc");
        if (!validTLD) revert InvalidTLD();

        string memory lbl = _extractLabel(_name);
        bytes memory lb = bytes(lbl);
        if (lb.length == 0 || lb.length > 63) revert InvalidName();
        if (lb[0] == 0x2d || lb[lb.length - 1] == 0x2d) revert InvalidName();

        for (uint256 i = 0; i < lb.length; i++) {
            bytes1 c = lb[i];
            bool ok = (c >= 0x61 && c <= 0x7a)
                   || (c >= 0x30 && c <= 0x39)
                   ||  c == 0x2d;
            if (!ok) revert InvalidName();
        }
    }

    function _extractLabel(string memory _name) internal pure returns (string memory) {
        bytes memory b = bytes(_name);
        uint256 dotPos = 0;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] == 0x2e) { dotPos = i; break; }
        }
        bytes memory lbl = new bytes(dotPos);
        for (uint256 i = 0; i < dotPos; i++) lbl[i] = b[i];
        return string(lbl);
    }

    function _hasSuffix(string calldata _name, string memory _suffix)
        internal pure returns (bool)
    {
        bytes memory nb = bytes(_name);
        bytes memory sb = bytes(_suffix);
        if (nb.length < sb.length) return false;
        uint256 offset = nb.length - sb.length;
        for (uint256 i = 0; i < sb.length; i++) {
            if (nb[offset + i] != sb[i]) return false;
        }
        return true;
    }
}
