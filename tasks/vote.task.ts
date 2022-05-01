// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import VotingArtifact from "../artifacts/contracts/Voting.sol/Voting.json";

task("vote", "Creates new polling")
  .addParam("contract", "Contract address")
  .addParam("pollingid", "Polling id")
  .addParam("candidateid", "Candidate id")
  .setAction(async ({ contract, pollingid, candidateid }, { ethers }) => {
    const [signer] = await ethers.getSigners();
    const voting = new ethers.Contract(contract, VotingArtifact.abi, signer);

    await voting.vote(pollingid, candidateid, {
      value: ethers.utils.parseEther("0.001"),
    });
    console.log("Voted");
  });
