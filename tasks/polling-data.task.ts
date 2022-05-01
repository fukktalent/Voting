// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import VotingArtifact from "../artifacts/contracts/Voting.sol/Voting.json";

task("polling-data", "Get polling by id")
  .addParam("contract", "Contract address")
  .addParam("pollingid", "Polling id")
  .setAction(async ({ contract, pollingid }, { ethers }) => {
    const [signer] = await ethers.getSigners();

    const voting = new ethers.Contract(contract, VotingArtifact.abi, signer);

    const { winner, finishDate, finished, amount, candidates } =
      await voting.pollingData(pollingid);
    console.log({
      winner,
      finishDate: parseInt(finishDate),
      finished,
      amount: parseInt(amount),
      candidates,
    });
  });
