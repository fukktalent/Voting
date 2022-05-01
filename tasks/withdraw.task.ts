// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import VotingArtifact from "../artifacts/contracts/Voting.sol/Voting.json";

task("withdraw", "Withdraws fee amount")
  .addParam("contract", "Contract address")
  .setAction(async ({ contract }, { ethers }) => {
    const [signer] = await ethers.getSigners();
    const voting = new ethers.Contract(contract, VotingArtifact.abi, signer);

    const tx = await voting.withdraw();
    console.log(tx);
  });
