/* eslint-disable camelcase */
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Voting__factory } from "../typechain-types";

async function main() {
  const [owner] = await ethers.getSigners();
  const voting = await new Voting__factory(owner).deploy();
  await voting.deployed();
  console.log("Voting deployed to:", voting.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
