// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import VotingArtifact from "../artifacts/contracts/Voting.sol/Voting.json";

task("candidate-data", "Get candidate by id")
  .addParam("contract", "Contract address")
  .addParam("pollingid", "Polling id")
  .addParam("candidateid", "Candidate id")
  .setAction(async ({ contract, pollingid, candidateid }, { ethers }) => {
    const [signer] = await ethers.getSigners();

    const voting = new ethers.Contract(contract, VotingArtifact.abi, signer);

    const { addr, votes } = await voting.candidateData(pollingid, candidateid);
    console.log({ addr, votes: parseInt(votes) });
  });
