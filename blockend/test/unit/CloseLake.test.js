const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

// Only run unit test in development chains (hardhat and localhost)
!developmentChains.includes(network.name) ? describe.skip : describe("Close Lake Marketplace Tests", () => {
    let closeLakeContract, closeLake, basicNFT, basicNFTContract, deployer, player, accounts
    const PRICE = ethers.utils.parseEther("0.1")
    const TOKEN_ID = 0

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        user = accounts[1]
        await deployments.fixture(["all"])
        closeLakeContract = await ethers.getContract("CloseLake")
        closeLake = await closeLakeContract.connect(deployer)
        basicNFTContract = await ethers.getContract("BasicNFT")
        basicNFT = await basicNFTContract.connect(deployer)
        await basicNFT.mintNft()
        await basicNFT.approve(closeLakeContract.address, TOKEN_ID)
    })
    describe("listItem", () => {
        it("reverts if the price is not above 0", async () => {
            const price = ethers.utils.parseEther("0")
            await expect(closeLake.listItem(basicNFT.address, TOKEN_ID, price)).to.be.revertedWith("PriceMustBeAboveZero")
        })
        it("emits an event after listing and item", async () => {
            expect(await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)).to.emit("ItemListed")
        })
        it("reverts if already listed", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            await expect(closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)).to.be.revertedWith("AlreadyListed")
        })
        it("reverts if not listed by the owner", async () => {
            closeLake = closeLakeContract.connect(user)
            await basicNFT.approve(user.address, TOKEN_ID)
            await expect(closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)).to.be.revertedWith("NotOwner")
        })
        it("reverts if not approved", async () => {
            // Doing this to approve with "0x" so it's  approved with another address.
            await basicNFT.approve(ethers.constants.AddressZero, TOKEN_ID)
            await expect(closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)).to.be.revertedWith(
                "NotApprovedForMarketplace"
            )
        })
        it("updates the listing seller correctly", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            const listing = await closeLake.getListing(basicNFT.address, TOKEN_ID)
            assert(listing.seller.toString() == deployer.address)
        }) 
        it("updates the listing price", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            const listing = await closeLake.getListing(basicNFT.address, TOKEN_ID)
            assert(listing.price.toString() == PRICE.toString())
        })
    })
    describe("cancelListing", () => {
        it("reverts if there is no listing", async () => {
            await expect(closeLake.cancelListing(basicNFT.address, TOKEN_ID)).to.be.revertedWith("NotListed")
        })
        it("reverts if is not the owner", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            closeLake = closeLakeContract.connect(user)
            await basicNFT.approve(user.address, TOKEN_ID)
            await expect(closeLake.cancelListing(basicNFT.address, TOKEN_ID)).to.be.revertedWith("NotOwner")
        })
        it("emits event", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            expect(await closeLake.cancelListing(basicNFT.address, TOKEN_ID)).to.emit("ItemCanceled")
        })
        it("removes listing", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            await closeLake.cancelListing(basicNFT.address, TOKEN_ID)
            const listing = await closeLake.getListing(basicNFT.address, TOKEN_ID)
            assert(listing.price.toString() == "0")
        })
    })
    describe("buyItem", () => {
        it("reverts if the buyer is the owner", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            await expect(closeLake.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })).to.be.revertedWith("IsNotOwner")
        })
        it("reverts if the item is not listed", async () => {
            await expect(closeLake.buyItem(basicNFT.address, TOKEN_ID)).to.be.revertedWith("NotListed")
        })
        it("reverts if the price is incorrect", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            closeLake = await closeLakeContract.connect(user)
            await expect(closeLake.buyItem(basicNFT.address, TOKEN_ID)).to.be.revertedWith("PriceNotMet")
        })
        it("emits event", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            closeLake = await closeLakeContract.connect(user)
            expect(await closeLake.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })).to.emit("ItemBought")
        })
        it("updates the owner correctly", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            closeLake = await closeLakeContract.connect(user)
            await closeLake.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })
            const newOwner = await basicNFT.ownerOf(TOKEN_ID)
            assert(newOwner.toString() == user.address)
        })
        it("updates the seller's proceeds", async () =>{
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            closeLake = await closeLakeContract.connect(user)
            await closeLake.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })
            const sellerProceeds = await closeLake.getProceeds(deployer.address)
            assert(sellerProceeds.toString() == PRICE.toString())
        })
    })
    describe("updateListing", () => {
        it("reverts if price is not above 0", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            const price = ethers.utils.parseEther("0")
            await expect(closeLake.updateListing(basicNFT.address, TOKEN_ID, price)).to.be.revertedWith("PriceMustBeAboveZero")
        })
        it("reverts if not listed", async () => {
            await expect(closeLake.updateListing(basicNFT.address, TOKEN_ID, PRICE)).to.be.revertedWith("NotListed")
        })
        it("reverts if not owner", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            closeLake = await closeLakeContract.connect(user)
            await expect(closeLake.updateListing(basicNFT.address, TOKEN_ID, PRICE)).to.be.revertedWith("NotOwner")
        })
        it("emits event correctly", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            expect(await closeLake.updateListing(basicNFT.address, TOKEN_ID, PRICE)).to.emit("ItemListed")
        })
        it("updates the price correctly", async () => {
            const newPrice = ethers.utils.parseEther("0.2")
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            await closeLake.updateListing(basicNFT.address, TOKEN_ID, newPrice)
            const listing = await closeLake.getListing(basicNFT.address, TOKEN_ID)
            assert(listing.price.toString() == newPrice.toString())
        })
    })
    describe("withdrawProceeds", () => {
        it("reverts if proceeds are 0", async () => {
            await expect(closeLake.withdrawProceeds()).to.be.revertedWith("NoProceeds")
        })
        it("withdraws proceeds", async () => {
            await closeLake.listItem(basicNFT.address, TOKEN_ID, PRICE)
            closeLake = await closeLakeContract.connect(user)
            await closeLake.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })
            closeLake = await closeLakeContract.connect(deployer)

            const deployerProceedsBefore = await closeLake.getProceeds(deployer.address)
            const deployerBalanceBefore = await deployer.getBalance()
            const txResponse = await closeLake.withdrawProceeds()
            const transactionReceipt = await txResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            const deployerBalanceAfter = await deployer.getBalance()
            
            assert(deployerBalanceAfter.add(gasCost).toString() == deployerProceedsBefore.add(deployerBalanceBefore).toString())
        })
    })
})