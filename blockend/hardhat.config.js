require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require('solidity-coverage')
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const POLYGONSCAN_KEY = process.env.POLYGONSCAN_KEY
const MUMBAI_ALCHEMY_API_URL = process.env.MUMBAI_ALCHEMY_API_URL
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL

module.exports = {
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 5,
      blockConfirmations: 6,
    },
    mumbai: {
      url: MUMBAI_ALCHEMY_API_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      blockConfirmations: 6,
    }
  },
  etherscan: {
    apiKey: {
        goerli: ETHERSCAN_API_KEY,
        mumbai: POLYGONSCAN_KEY,
    },
    customChains: [
        {
            network: "mumbai",
            chainId: 80001,
            urls: {
                apiURL: "https://api-testnet.polygonscan.com/api",
                browserURL: "https://mumbai.polygonscan.com/",
            },
        },
    ],
},
  solidity: "0.8.7",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
  },
  mocha: {
    timeout: 360000, // 6 minutes max for running tests
  }
};
