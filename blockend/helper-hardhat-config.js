const { ethers } = require("hardhat")

const networkConfig = {
    default: {
        name: "hardhat",
        timeInterval: "30"
    },
    5: {
        name: "goerli",
    },
    80001: {
        name: "mumbai",
    },
    31337: {
        name:"localhost",
    }
}
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS
}