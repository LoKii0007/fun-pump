const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  const FEE = ethers.parseUnits("0.01", 18);

  async function deployFactoryFixture() {
    const [deployer, creator, buyer] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy(FEE);

    const transaction = await factory
      .connect(creator)
      .create("dapp uni", "DAPP", { value: FEE });
    await transaction.wait();

    const tokenAddress = await factory.tokens(0);
    const token = await ethers.getContractAt("Token", tokenAddress);

    return { factory, deployer, creator, token, buyer };
  }

  async function buyTokenFixture() {
    const { factory, creator, token, buyer } = await deployFactoryFixture();

    const AMOUNT = ethers.parseUnits("10000", 18);
    const COST = ethers.parseUnits("1", 18);

    const transaction = await factory
      .connect(buyer)
      .buy(await token.getAddress(), AMOUNT, { value: COST });
    await transaction.wait();

    return { factory, token, creator, buyer };
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

  describe("Create", () => {
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
      const totalSupply = ethers.parseUnits("1000000", 18);
      expect(await token.balanceOf(await factory.getAddress())).to.equal(
        totalSupply
      );
    });

    it("should update ETH balance", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );
      expect(balance).to.equal(FEE);
    });

    it("should create the sale", async function () {
      const { factory, token, creator } = await loadFixture(
        deployFactoryFixture
      );
      const count = await factory.totalTokens();
      expect(count).to.equal(1);

      const sale = await factory.getTokenSale(0);

      expect(sale.token).to.equal(await token.getAddress());
      expect(sale.creator).to.equal(creator.address);
      expect(sale.sold).to.equal(0);
      expect(sale.raised).to.equal(0);
      expect(sale.isOpen).to.equal(true);
    });
  });

  describe("Buying", () => {
    const AMOUNT = ethers.parseUnits("10000", 18);
    const COST = ethers.parseUnits("1", 18);

    // contract recieved eth
    it("should update ETH balance", async function () {
      const { factory } = await loadFixture(buyTokenFixture);
      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );
      expect(balance).to.equal(COST + FEE);
    });

    //? check that buyer recieved tokens
    it("should recieve token", async function () {
      const { buyer, token } = await loadFixture(buyTokenFixture);

      const balance = await token.balanceOf(buyer.address);

      expect(balance).to.equal(AMOUNT);
    });

    it("should update the token sale", async function () {
      const { factory, token } = await loadFixture(buyTokenFixture);

      const sale = await factory.tokenToSale(await token.getAddress());

      expect(sale.sold).to.equal(AMOUNT);
      expect(sale.raised).to.equal(COST);
      expect(sale.isOpen).to.equal(true);
    });

    it("should increase the base cost", async function () {
      const { factory, token } = await loadFixture(buyTokenFixture);

      const sale = await factory.tokenToSale(await token.getAddress());
      const cost = await factory.getCost(sale.sold);

      expect(cost).to.equal(ethers.parseUnits("0.0002", 18));
    });
  });

  describe("Depositing", () => {
    const AMOUNT = ethers.parseUnits("10000", 18);
    const COST = ethers.parseUnits("2", 18);

    it("sale should be closed and successfully deposits", async function () {
      const { factory, buyer, token, creator } = await loadFixture(
        buyTokenFixture
      );

      // buy tokens again to reach the target
      const BuyTx = await factory
        .connect(buyer)
        .buy(await token.getAddress(), AMOUNT, { value: COST });
      await BuyTx.wait();

      const sale = await factory.tokenToSale(await token.getAddress());
      expect(sale.isOpen).to.equal(false);

      const depositTx = await factory
        .connect(creator)
        .deposit(await token.getAddress());
      await depositTx.wait();

      //! TODO write test for ETH transferred to creator
    });
  });

  describe("withdrawing fees", ()=>{
    it("shouldupdate ETH balances", async function(){
      const { factory, deployer } = await loadFixture(
        deployFactoryFixture
      );

      const transaction = await factory.connect(deployer).withdraw(FEE)
      await transaction.wait()

      const balance = await ethers.provider.getBalance(await factory.getAddress());
      expect(balance).to.equal(0)
    })
  })
});
