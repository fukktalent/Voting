// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import VotingArtifact from "../artifacts/contracts/Voting.sol/Voting.json";

task("finish", "Finish polling")
  .addParam("contract", "Contract address")
  .addParam("pollingid", "Polling id")
  .setAction(async ({ contract, pollingid }, { ethers }) => {
    const [signer] = await ethers.getSigners();
    const voting = new ethers.Contract(contract, VotingArtifact.abi, signer);

    // to test
    // await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
    // await ethers.provider.send("evm_mine", []);

    await voting.finish(pollingid);
    console.log("Finished");
  });
