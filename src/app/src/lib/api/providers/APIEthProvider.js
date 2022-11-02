import get from "lodash/get";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import APIProvider from "./APIProvider";
import Web3 from "web3";
import { maxAllowance } from "../constants";
import axios from "axios";

export default class APIEthProvider extends APIProvider {
  static validSides = ["b", "s"];
  static ETH_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

  wallet = null;
  ethWallet = null;
  provider = null;
  signedMsg = null;
  accountState = null;
  _tokenWithdrawFees = {};

  getProfile = async (address) => {
    if (address) {
      try {
        const { data } = await axios
          .get(`https://ipfs.3box.io/profile?address=${address}`)
          .catch((err) => {
            if (err.response.status === 404) {
              throw err;
            }
          });

        if (data) {
          const profile = {
            coverPhoto: get(data, "coverPhoto.0.contentUrl./"),
            image: get(data, "image.0.contentUrl./"),
            description: data.description,
            emoji: data.emoji,
            website: data.website,
            location: data.location,
            twitter_proof: data.twitter_proof,
          };

          if (data.name) {
            profile.name = data.name;
          }
          if (profile.image) {
            profile.image = `https://gateway.ipfs.io/ipfs/${profile.image}`;
          }

          return profile;
        }
      } catch (err) {
        if (!err.response) {
          throw err;
        }
      }
    } else {
      return;
    }
  };

  signMessage = async () => {
    const message = "Login to Dexpresso";
    if (
      sessionStorage.getItem("login") === null ||
      this.api.changingWallet === true
    ) {
      try {
        const from = this.syncWallet.cachedAddress;
        this.signedMsg = await window.ethereum.request({
          method: "personal_sign",
          params: [message, from],
        });
        sessionStorage.setItem("login", this.signedMsg);
      } catch (err) {
        console.error(err);
      }
    }
  };

  verifyMessage = async () => {
    const message = "Login to Dexpresso";
    try {
      const from = this.syncWallet.cachedAddress;
      new TextEncoder("utf-8").encode(message).toString("hex");
      const recoveredAddr = await Web3.eth.accounts.recover(
        message,
        this.globalSignature
      );

      if (recoveredAddr.toLowerCase() === from.toLowerCase()) {
        console.log(`Successfully ecRecovered signer as ${recoveredAddr}`);
      } else {
        console.log(
          `Failed to verify signer when comparing ${recoveredAddr} to ${from}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  getTransactionState = async (txHash) => {
    const tx = await this.provider.getTransactionInfo(txHash);
    return tx;
  };

  submitOrder = async (
    market,
    side,
    price,
    chainId,
    amount,
    sellTokenAddress,
    buyTokenAddress,
    fee,
    orderType
  ) => {
    amount = parseFloat(amount);
    price = parseFloat(price).toPrecision(8).toString();
    price = ethers.utils.parseUnits(price, 18);
    fee = ethers.utils.parseUnits(fee, 18);

    const currencies = market.split("-");
    const nowUnix = (Date.now() / 1000) | 0;
    const validUntil = nowUnix + 24 * 3600;

    if (currencies[0] === "USDC" || currencies[0] === "USDT") {
      amount = parseFloat(amount).toFixed(7).slice(0, -1);
    }

    if (!APIEthProvider.validSides.includes(side)) {
      throw new Error("Invalid side");
    }

    if (side === "s") {
      const allowance = await this.checkAllowance(
        this.wallet,
        APIEthProvider.ETH_CONTRACT_ADDRESS,
        sellTokenAddress
      );
      if (allowance < amount) {
        throw new Error("Insufficient allowance");
      }
    }

    if (side === "b") {
      const allowance = await this.checkAllowance(
        this.wallet,
        APIEthProvider.ETH_CONTRACT_ADDRESS,
        buyTokenAddress
      );
      if (allowance < amount) {
        throw new Error("Insufficient allowance");
      }
    }

    const order = {
      validUntil,
      price,
      sellTokenAddress,
      buyTokenAddress,
      chainId,
      fee,
    };
    const orderHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "address", "address", "uint256", "uint256"],
      [
        order.validUntil,
        order.price,
        order.sellTokenAddress,
        order.buyTokenAddress,
        order.chainId,
        order.fee,
      ]
    );

    const signer = new ethers.providers.Web3Provider(
      window.ethereum
    ).getSigner();
    const signature = await signer.signMessage(
      ethers.utils.arrayify(orderHash)
    );
    const signedOrder = {
      ...order,
      signature,
    };

    this.api.sendRequest(
      "user/order",
      "POST",
      {
        tx: signedOrder,
        market,
        amount,
        price,
        side,
        type: orderType,
      },
      true
    );

    return signedOrder;
  };

  checkAllowance = async (userAddress, spenderAddress, tokenAddress) => {
    const ERC20_ABI = [
      "function allowance(address owner, address spender) view returns (uint256)",
    ];

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const allowance = await token.allowance(userAddress, spenderAddress);

    return allowance;
  };

  getBalance = async () => {
    const account = this.wallet;
    const balances = {};

    Object.keys(this.api.currencies).forEach((ticker) => {
      const currency = this.api.currencies[ticker];
      const balance = account ? this.getTokenBalance("", account) || 0 : 0;
      balances[ticker] = {
        value: balance,
        valueReadable: balance && balance / 10 ** currency.decimals,
        allowance: maxAllowance,
      };
    });

    return balances;
  };

  getTokenBalance = async (userAddress, tokenAddress) => {
    const ERC20_ABI = [
      "function balanceOf(address account) view returns (uint256)",
    ];

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await token.balanceOf(userAddress);
    return balance;
  };

  getEthBalance = async () => {
    const ethBalance = await this.provider.getBalance(this.ethWallet.address);

    return ethBalance;
  };

  getChainName = (chainId) => {
    if (Number(chainId) === 1) {
      return "mainnet";
    } else if (Number(chainId) === 1000) {
      return "goerli";
    } else {
      throw Error("Chain ID not understood");
    }
  };

  signIn = async () => {
    try {
      this.provider = ethers.providers.Web3Provider(window.ethereum);
    } catch (e) {
      toast.error(`Connection to ${this.networkName} network is lost`);
      throw e;
    }

    try {
      this.wallet = this.provider.getSigner();
      this.ethWallet = new ethers.Wallet(
        this.wallet._signingKey().privateKey,
        this.provider
      );
    } catch (err) {
      throw err;
    }

    return true;
  };
}
