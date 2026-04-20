// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TruthChainRegistry {
    struct Fingerprint {
        bytes32 contentHash;
        uint256 score;
        uint256 timestamp;
    }

    mapping(bytes32 => Fingerprint) private fingerprints;
    event FingerprintStored(bytes32 indexed contentHash, uint256 score, uint256 timestamp);

    function storeFingerprint(bytes32 contentHash, uint256 score, uint256 timestamp) external {
        fingerprints[contentHash] = Fingerprint({
            contentHash: contentHash,
            score: score,
            timestamp: timestamp
        });

        emit FingerprintStored(contentHash, score, timestamp);
    }

    function getFingerprint(bytes32 contentHash) external view returns (Fingerprint memory) {
        return fingerprints[contentHash];
    }
}
