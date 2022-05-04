//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @dev Allows to create pollings with given addresses list. Vote costs 0.001 ether.
 * Winner get 90% of prize pool. Polling cannot be finished if no one voted 
 * or if there are several participants with the same number of votes.
 */
contract Voting is Ownable {
    using Address for address payable;

    struct Polling {
        address winner;
        uint winnerVotes;

        uint finishDate;
        bool finished;

        uint amount; 

        uint[] candidateVotes;
        address[] candidates;

        mapping (address => bool) voters;
    }

    // polling exists
    modifier exists(uint _pollingId) {
      require(_pollingId < numPollings, "Polling not found");
      _;
    }

    // polling active
    modifier active(uint _pollingId) {
        require(!pollings[_pollingId].finished, "Polling finished");
        _;
    }

    uint public fee;

    uint public numPollings;
    mapping (uint => Polling) private pollings;

    event CreatedEvent(uint pollingId);
    event VotedEvent(uint pollingId, uint candidateId, address voterAddr);
    event FinishedEvent(address winnerAddr);

    /**
     * @dev "Creates" polling and sets candidates
     */
    function createPolling(address[] calldata _candidates) external onlyOwner {
        require(_candidates.length > 1, "Less two candidates");
        uint pollingId = numPollings;
        Polling storage polling = pollings[pollingId];

        polling.candidates = _candidates;
        polling.candidateVotes = new uint[](_candidates.length);

        polling.finishDate = block.timestamp + 3 days;
        numPollings++;

        emit CreatedEvent(pollingId);
    }

    /**
     * @dev Increase the votes number of chosen candidate and check it against current leader of polling
     */
    function vote(uint _pollingId, uint _candidateId) external payable exists(_pollingId) active(_pollingId) {
        require(msg.value == 0.001 ether, "Vote costs 0.001 ether");

        Polling storage polling = pollings[_pollingId];
        require(!polling.voters[msg.sender], "Already voted");
        require(_candidateId < polling.candidates.length, "Candidate not found");

        polling.voters[msg.sender] = true;

        polling.candidateVotes[_candidateId]++;

        // if several candidates with same votes amount then there is no winner 
        if (polling.candidateVotes[_candidateId] == polling.winnerVotes) {
            polling.winner = address(0);
        }

        if (polling.candidateVotes[_candidateId] > polling.winnerVotes) {
            polling.winnerVotes = polling.candidateVotes[_candidateId];
            polling.winner = polling.candidates[_candidateId];
        } 

        uint voteFee = msg.value / 10;
        polling.amount += msg.value - voteFee;
        fee += voteFee;

        emit VotedEvent(_pollingId, _candidateId, msg.sender);
    }

    /**
     * @dev If there is a winner and three days have passed the polling ends and the prize sends to winner.
     */
    function finish(uint _pollingId) external exists(_pollingId) active(_pollingId) {
        Polling storage polling = pollings[_pollingId];
        require(block.timestamp > polling.finishDate, "Early to finish");
        require(polling.winner != address(0), "No winner yet");

        polling.finished = true;
        payable(polling.winner).sendValue(polling.amount);

        emit FinishedEvent(polling.winner);
    }

    /**
     * @dev Sends fee to owner
     */
    function withdraw() external onlyOwner {
        require(fee != 0, "Zero balance");

        uint withdrawAmount = fee;
        fee = 0;

        payable(owner()).sendValue(withdrawAmount);
    }

    function pollingData(uint _pollingId) external view exists(_pollingId) returns (address winner, uint finishDate, bool finished, uint amount, address[] memory candidates) {
        Polling storage polling = pollings[_pollingId];

        return (polling.winner, polling.finishDate, polling.finished, polling.amount, polling.candidates);
    }

    function candidateData(uint _pollingId, uint _candidateId) external view exists(_pollingId) returns (address addr, uint votes) {
        Polling storage polling = pollings[_pollingId];
        require(_candidateId < polling.candidates.length, "Candidate not found");

        return (pollings[_pollingId].candidates[_candidateId], pollings[_pollingId].candidateVotes[_candidateId]);
    }
}
