// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import VotingArtifact from "../artifacts/contracts/Voting.sol/Voting.json";

task("create", "Creates new polling")
  .addParam("candidates", "Candidates addresses")
  .addParam("contract", "Contract address")
  .setAction(async ({ contract, candidates }, { ethers }) => {
    const [signer] = await ethers.getSigners();

    const voting = new ethers.Contract(contract, VotingArtifact.abi, signer);

    const candidatesArray = candidates.split(",");

    const tx = await voting.createPolling(candidatesArray);

    // for tests
    // const rc = await tx.wait();
    // const createdEventData = rc.events?.find((e: any) => {
    //   return e.event === "CreatedEvent";
    // });
    // createdEventData &&
    //   console.log(`\nPolling id: ${parseInt(createdEventData.args.pollingId)}`);

    console.log("Created");
  });
