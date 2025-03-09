import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import "@openzeppelin/hardhat-upgrades";

describe("NSPOINTS", function () {
  async function deployNSPointsFixture() {
    // Get the signers
    const [owner, user1, user2] = await hre.ethers.getSigners();

    // Deploy the contract
    const NSPoints = await hre.ethers.getContractFactory("NSPOINTS");
    const nspoints = await hre.upgrades.deployProxy(NSPoints);
    await nspoints.waitForDeployment();

    return { nspoints, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { nspoints } = await loadFixture(deployNSPointsFixture);

      expect(await nspoints.name()).to.equal("NSDEVPOINTS");
      expect(await nspoints.symbol()).to.equal("NSDEV");
    });

    it("Should set the right owner", async function () {
      const { nspoints, owner } = await loadFixture(deployNSPointsFixture);

      expect(await nspoints.owner()).to.equal(owner.address);
    });

    it("Should set owner as allowed transfer address", async function () {
      const { nspoints, owner } = await loadFixture(deployNSPointsFixture);

      expect(await nspoints.isAllowedTransferAddress(owner.address)).to.be.true;
    });
  });

  describe("Transfer Restrictions", function () {
    it("Should allow owner to transfer tokens", async function () {
      const { nspoints, owner, user1 } = await loadFixture(deployNSPointsFixture);

      // Mint some tokens to owner
      await nspoints.mint(owner.address, 1000);

      // Owner should be able to transfer
      await expect(nspoints.transfer(user1.address, 100))
        .to.not.be.reverted;

      expect(await nspoints.balanceOf(user1.address)).to.equal(100);
    });

    it("Should prevent non-allowed addresses from transferring tokens", async function () {
      const { nspoints, owner, user1, user2 } = await loadFixture(deployNSPointsFixture);

      // Mint tokens to user1
      await nspoints.mint(user1.address, 1000);

      // User1 should not be able to transfer
      await expect(nspoints.connect(user1).transfer(user2.address, 100))
        .to.be.revertedWith("NSPOINTS: sender not allowed to transfer");
    });

    it("Should prevent non-allowed addresses from using transferFrom", async function () {
      const { nspoints, owner, user1, user2 } = await loadFixture(deployNSPointsFixture);

      // Mint tokens to user1
      await nspoints.mint(user1.address, 1000);

      // Approve user2 to spend user1's tokens
      await nspoints.connect(user1).approve(user2.address, 500);

      // User2 should not be able to transfer even with approval
      await expect(nspoints.connect(user2).transferFrom(user1.address, user2.address, 100))
        .to.be.revertedWith("NSPOINTS: sender not allowed to transfer");
    });
  });

  describe("Allowed Transfer Address Management", function () {
    it("Should allow owner to add allowed transfer addresses", async function () {
      const { nspoints, owner, user1 } = await loadFixture(deployNSPointsFixture);

      await expect(nspoints.addAllowedTransferAddress(user1.address))
        .to.emit(nspoints, "AllowedTransferAddressAdded")
        .withArgs(user1.address);

      expect(await nspoints.isAllowedTransferAddress(user1.address)).to.be.true;
    });

    it("Should allow owner to remove allowed transfer addresses", async function () {
      const { nspoints, owner, user1 } = await loadFixture(deployNSPointsFixture);

      // First add the address
      await nspoints.addAllowedTransferAddress(user1.address);

      // Then remove it
      await expect(nspoints.removeAllowedTransferAddress(user1.address))
        .to.emit(nspoints, "AllowedTransferAddressRemoved")
        .withArgs(user1.address);

      expect(await nspoints.isAllowedTransferAddress(user1.address)).to.be.false;
    });

    it("Should prevent non-owners from managing allowed transfer addresses", async function () {
      const { nspoints, user1, user2 } = await loadFixture(deployNSPointsFixture);

      await expect(nspoints.connect(user1).addAllowedTransferAddress(user2.address))
        .to.be.revertedWithCustomError(nspoints, "OwnableUnauthorizedAccount");

      await expect(nspoints.connect(user1).removeAllowedTransferAddress(user2.address))
        .to.be.revertedWithCustomError(nspoints, "OwnableUnauthorizedAccount");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const { nspoints, owner, user1 } = await loadFixture(deployNSPointsFixture);

      await expect(nspoints.mint(user1.address, 1000))
        .to.changeTokenBalance(nspoints, user1, 1000);
    });

    it("Should prevent non-owners from minting tokens", async function () {
      const { nspoints, user1, user2 } = await loadFixture(deployNSPointsFixture);

      await expect(nspoints.connect(user1).mint(user2.address, 1000))
        .to.be.revertedWithCustomError(nspoints, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfer Functionality", function () {
    it("Should allow transfers between addresses when sender is allowed", async function () {
      const { nspoints, owner, user1, user2 } = await loadFixture(deployNSPointsFixture);

      // Add user1 as allowed transfer address
      await nspoints.addAllowedTransferAddress(user1.address);

      // Mint tokens to user1
      await nspoints.mint(user1.address, 1000);

      // User1 should be able to transfer
      await expect(nspoints.connect(user1).transfer(user2.address, 500))
        .to.changeTokenBalances(
          nspoints,
          [user1, user2],
          [-500, 500]
        );
    });

    it("Should allow transferFrom when sender is allowed", async function () {
      const { nspoints, owner, user1, user2 } = await loadFixture(deployNSPointsFixture);

      // Add user2 as allowed transfer address
      await nspoints.addAllowedTransferAddress(user2.address);

      // Mint tokens to user1
      await nspoints.mint(user1.address, 1000);

      // Approve user2 to spend user1's tokens
      await nspoints.connect(user1).approve(user2.address, 500);

      // User2 should be able to transfer
      await expect(nspoints.connect(user2).transferFrom(user1.address, user2.address, 300))
        .to.changeTokenBalances(
          nspoints,
          [user1, user2],
          [-300, 300]
        );
    });
  });
});
