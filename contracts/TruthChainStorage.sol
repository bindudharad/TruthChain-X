// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TruthChainStorage {
    struct Result {
        string contentHash;
        uint256 trustScore;
        string verdict;
        uint256 timestamp;
        address user;
    }

    mapping(address => Result[]) private userResults;
    mapping(string => Result) private resultsByHash;

    event ResultStored(
        string indexed contentHash,
        uint256 trustScore,
        string verdict,
        uint256 timestamp,
        address indexed user
    );

    function storeResult(
        string memory contentHash,
        uint256 trustScore,
        string memory verdict
    ) external {
        Result memory result = Result({
            contentHash: contentHash,
            trustScore: trustScore,
            verdict: verdict,
            timestamp: block.timestamp,
            user: msg.sender
        });

        userResults[msg.sender].push(result);
        resultsByHash[contentHash] = result;

        emit ResultStored(contentHash, trustScore, verdict, block.timestamp, msg.sender);
    }

    function getResults(address user) external view returns (Result[] memory) {
        return userResults[user];
    }

    function getResultByHash(string memory contentHash) external view returns (Result memory) {
        return resultsByHash[contentHash];
    }
}
