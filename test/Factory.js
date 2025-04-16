const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  const FEE = ethers.parseUnits("0.01", 18);

  async function deployFactoryFixture() {
    const [deployer, creator] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy(FEE);

    const transaction = await factory
      .connect(creator)
      .create("dapp uni", "DAPP", { value: FEE });
    await transaction.wait();

    const tokenAddress = await factory.tokens(0);
    const token = await ethers.getContractAt("Token", tokenAddress);

    return { factory, deployer, creator, token };
  }

  describe("Deployment", function () {
    it("should set the fee", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const fee = await factory.platformFee();

      expect(fee).to.equal(FEE);
    });

    it("should set the owner", async function () {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);
      const owner = await factory.owner();

      expect(owner).to.equal(deployer.address);
    });
  });

  describe("create", () => {
    it("should set the owner", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(await token.owner()).to.equal(await factory.getAddress());
    });

    it("should set the creator", async function () {
      const { token, creator } = await loadFixture(deployFactoryFixture);
      expect(await token.creator()).to.equal(creator.address);
    });

    it("should set the supply", async function () {
      const { token, factory } = await loadFixture(deployFactoryFixture);
      const totalSupply = ethers.parseUnits("1000000", 18)
      expect(await token.balanceOf(await factory.getAddress())).to.equal(totalSupply);
    });

    it("should update ETH balance", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const balance = await ethers.provider.getBalance(await factory.getAddress())
      expect(balance).to.equal(FEE);
    });


  });
});
