/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line camelcase
import { Voting__factory, Voting } from "../typechain-types";

describe("Voting", function () {
  let voting: Voting;
  let owner: SignerWithAddress;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let acc3: SignerWithAddress;

  beforeEach(async function () {
    [owner, acc1, acc2, acc3] = await ethers.getSigners();
    voting = await new Voting__factory(owner).deploy();
    await voting.deployed();
  });

  describe("Polling creating", function () {
    it("Should create new polling", async function () {
      await expect(voting.createPolling([acc1.address, acc2.address]))
        .to.emit(voting, "CreatedEvent")
        .withArgs(0);

      const polling = await voting.pollingData(0);
      expect(polling.candidates).to.eql([acc1.address, acc2.address]);
      expect(polling.finished).to.eql(false);
      expect(polling.winner).to.eql(ethers.constants.AddressZero);
    });

    it("Should reverted with no owner error", async function () {
      await expect(
        voting
          .connect(acc3)
          .createPolling([acc1.address, acc2.address, acc3.address])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await voting.createPolling([acc1.address, acc2.address]);
    });

    it("Should vote for one of candidates", async function () {
      const tx = await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });

      await expect(tx)
        .to.emit(voting, "VotedEvent")
        .withArgs(0, 0, acc3.address);

      await expect(tx).to.changeEtherBalances(
        [acc3, voting],
        [ethers.utils.parseEther("-0.001"), ethers.utils.parseEther("0.001")]
      );

      expect(await voting.fee()).to.eql(ethers.utils.parseEther("0.0001"));

      const polling = await voting.pollingData(0);
      expect(polling.finished).to.eql(false);
      expect(polling.winner).to.eql(acc1.address);

      const candidate = await voting.candidateData(0, 0);
      expect(candidate.votes).to.eql(ethers.BigNumber.from(1));
    });

    it("Should revert with vote costs error when send more ether than necessary", async function () {
      await expect(
        voting.connect(acc3).vote(0, 0, {
          value: ethers.utils.parseEther("0.0010001"),
        })
      ).to.be.revertedWith("Vote costs 0.001 ether");
    });

    it("Should revert with vote costs error when doesn't send ether", async function () {
      await expect(voting.connect(acc3).vote(0, 0)).to.be.revertedWith(
        "Vote costs 0.001 ether"
      );
    });

    it("Should revert with polling not found", async function () {
      await expect(
        voting.connect(acc3).vote(1, 0, {
          value: ethers.utils.parseEther("0.001"),
        })
      ).to.be.revertedWith("Polling not found");
    });

    it("Should revert with candidate not found", async function () {
      await expect(
        voting.connect(acc3).vote(0, 3, {
          value: ethers.utils.parseEther("0.001"),
        })
      ).to.be.revertedWith("Candidate not found");
    });

    it("Should revert with already finished error", async function () {
      await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });

      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await voting.finish(0);
      await expect(
        voting.connect(acc3).vote(0, 3, {
          value: ethers.utils.parseEther("0.001"),
        })
      ).to.be.revertedWith("Polling finished");
    });

    it("Should revert with already voted", async function () {
      await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });
      await expect(
        voting.connect(acc3).vote(0, 1, {
          value: ethers.utils.parseEther("0.001"),
        })
      ).to.be.revertedWith("Already voted");
    });
  });

  describe("Finish polling", function () {
    beforeEach(async function () {
      await voting.createPolling([acc1.address, acc2.address]);
    });

    it("Should finish polling and send prize amount to winner", async function () {
      await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });

      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const tx = await voting.finish(0);
      await expect(tx).to.emit(voting, "FinishedEvent").withArgs(acc1.address);
      await expect(tx).to.changeEtherBalances(
        [voting, acc1],
        [ethers.utils.parseEther("-0.0009"), ethers.utils.parseEther("0.0009")]
      );
    });

    it("Should revert with polling not found error", async function () {
      await expect(voting.finish(1)).to.be.revertedWith("Polling not found");
    });

    it("Should revert with early to finish error", async function () {
      await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });

      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(voting.finish(0)).to.be.revertedWith("Early to finish");
    });

    it("Should revert with no winner error when two candidates with same votes amount", async function () {
      await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });
      await voting.connect(acc2).vote(0, 1, {
        value: ethers.utils.parseEther("0.001"),
      });

      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(voting.finish(0)).to.be.revertedWith("No winner yet");
    });

    it("Should revert with no winner error when no votes", async function () {
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(voting.finish(0)).to.be.revertedWith("No winner yet");
    });

    it("Should revert with already finished error", async function () {
      await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });

      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await voting.finish(0);

      const balanceAcc1 = await ethers.provider.getBalance(acc1.address);
      const balanceAcc2 = await ethers.provider.getBalance(acc2.address);
      await expect(voting.finish(0)).to.be.revertedWith("Polling finished");
      expect(await ethers.provider.getBalance(acc1.address)).to.eql(
        balanceAcc1
      );
      expect(await ethers.provider.getBalance(acc2.address)).to.eql(
        balanceAcc2
      );
    });
  });

  describe("Withdraw", function () {
    it("Should withdraw fee ethers to owner address", async function () {
      await voting.createPolling([acc1.address, acc2.address]);
      await voting.connect(acc1).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });
      await voting.connect(acc2).vote(0, 1, {
        value: ethers.utils.parseEther("0.001"),
      });
      await voting.connect(acc3).vote(0, 0, {
        value: ethers.utils.parseEther("0.001"),
      });

      const tx = await voting.withdraw();
      await expect(tx).to.changeEtherBalances(
        [voting, owner],
        [ethers.utils.parseEther("-0.0003"), ethers.utils.parseEther("0.0003")]
      );
    });

    it("Should reverted with zero balance error", async function () {
      await expect(voting.withdraw()).to.be.revertedWith("Zero balance");
    });

    it("Should reverted with no owner error", async function () {
      const balance = await ethers.provider.getBalance(acc3.address);
      await expect(voting.connect(acc3).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      expect(await ethers.provider.getBalance(acc3.address)).to.eql(balance);
    });
  });

  describe("View polling data", function () {
    beforeEach(async function () {
      await voting.createPolling([acc1.address, acc2.address]);
    });

    it("Should return polling data", async function () {
      const polling = await voting.pollingData(0);
      expect(polling).to.include.keys([
        "winner",
        "finishDate",
        "finished",
        "amount",
        "candidates",
      ]);
    });

    it("Should revert with polling not found error", async function () {
      await expect(voting.pollingData(1)).to.be.revertedWith(
        "Polling not found"
      );
    });
  });

  describe("View candidate data", function () {
    beforeEach(async function () {
      await voting.createPolling([acc1.address, acc2.address]);
    });

    it("Should return candidate data", async function () {
      const candidate = await voting.candidateData(0, 0);
      expect(candidate).to.include.keys(["addr", "votes"]);
    });

    it("Should revert with polling not found error", async function () {
      await expect(voting.candidateData(1, 0)).to.be.revertedWith(
        "Polling not found"
      );
    });

    it("Should revert with candidate not found error", async function () {
      await expect(voting.candidateData(0, 3)).to.be.revertedWith(
        "Candidate not found"
      );
    });
  });
});
