// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExamPapers {
    struct Paper {
        string cid;        // IPFS CID of encrypted paper
        address uploader;  // teacher wallet (not used in demo)
        uint256 time;      // block timestamp
    }

    struct PaperEvent {
        string s_code;
        string action;     // "submitted" | "selected" | "finalized"
        string ref;        // CID, candidate hash, or other reference
        address actor;
        uint256 timestamp;
    }

    // map subject code -> latest paper
    mapping(string => Paper) public papers;

    // append-only lifecycle event log
    PaperEvent[] public events;
    mapping(string => uint256[]) public paperEvents; // s_code -> event indices

    event PaperRecorded(string indexed s_code, string cid, address indexed uploader);
    event PaperEventRecorded(string indexed s_code, string action, string ref, address indexed actor, uint256 timestamp);

    function recordPaper(string memory s_code, string memory cid) public {
        papers[s_code] = Paper(cid, msg.sender, block.timestamp);
        emit PaperRecorded(s_code, cid, msg.sender);
    }

    function getPaper(string memory s_code) public view returns (string memory, address, uint256) {
        Paper memory p = papers[s_code];
        return (p.cid, p.uploader, p.time);
    }

    /**
     * @notice Append a lifecycle event to the immutable audit trail.
     * @param s_code   Subject/code identifying the paper/request.
     * @param action   Lifecycle stage: "submitted", "selected", or "finalized".
     * @param ref      Privacy-preserving reference (e.g. CID or hashed candidate ID).
     */
    function recordEvent(string memory s_code, string memory action, string memory ref) public {
        uint256 idx = events.length;
        events.push(PaperEvent(s_code, action, ref, msg.sender, block.timestamp));
        paperEvents[s_code].push(idx);
        emit PaperEventRecorded(s_code, action, ref, msg.sender, block.timestamp);
    }

    /**
     * @notice Return the number of events on record for a given s_code.
     */
    function getEventCount(string memory s_code) public view returns (uint256) {
        return paperEvents[s_code].length;
    }
}
