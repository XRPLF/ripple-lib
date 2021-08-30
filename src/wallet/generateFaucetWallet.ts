import https = require("https");

import { Client } from "..";
import { errors } from "../common";
import { RippledError } from "../common/errors";
import { isValidAddress } from "../common/schema-validator";
import { GeneratedAddress } from "../utils/generateAddress";
import Wallet from "./Wallet";

export interface FaucetWallet {
  account: GeneratedAddress;
  amount: number;
  balance: number;
}

export enum FaucetNetwork {
  Testnet = "faucet.altnet.rippletest.net",
  Devnet = "faucet.devnet.rippletest.net",
}

const INTERVAL_SECONDS = 1; // Interval to check an account balance
const MAX_ATTEMPTS = 20; // Maximum attempts to retrieve a balance

/**
 * Generates a random wallet with some amount of XRP (usually 1000 XRP).
 *
 * @param {Client} this
 * @param {Wallet} wallet - An existing XRPL Wallet to fund, if undefined, a new Wallet will be created.
 * @returns {Promise<Wallet>} - A Wallet on the Testnet or Devnet that contains some amount of XRP.
 */
async function generateFaucetWallet(
  this: Client,
  wallet?: Wallet
): Promise<Wallet | void> {
  if(!this.isConnected())
    throw new RippledError("Client not connected, cannot call faucet")

  // Initialize some variables
  let body: Uint8Array | undefined;
  let startingBalance = 0;
  const faucetUrl = getFaucetUrl(this);

  // If no existing Wallet is provided or its address is invalid to fund
  if (!wallet || !isValidAddress(wallet.classicAddress)) {
    wallet = Wallet.generate()
  }

  // Create the POST request body
  body = new TextEncoder().encode(
    JSON.stringify({
      destination: wallet.classicAddress
    })
  )
  // Retrieve the existing account balance
  const addressToFundBalance = await getAddressXrpBalance(this, wallet.classicAddress)

  // Check the address balance is not undefined and is a number
  if (addressToFundBalance && !isNaN(+addressToFundBalance)) {
    startingBalance = +addressToFundBalance
  } else {
    startingBalance = 0
  }

  // Options to pass to https.request
  const options = {
    hostname: faucetUrl,
    port: 443,
    path: "/accounts",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": body ? body.length : 0,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      const chunks: any[] = [];
      response.on("data", (d) => {
        chunks.push(d);
      });
      response.on("end", async () => {
        const body = Buffer.concat(chunks).toString();

        // "application/json; charset=utf-8"
        if (response.headers['content-type']?.startsWith('application/json')) {
          const faucetWallet: FaucetWallet = JSON.parse(body)
          const classicAddress = faucetWallet.account.classicAddress

          if (classicAddress) {
            try {
              // Check at regular interval if the address is enabled on the XRPL and funded
              const isFunded = await hasAddressBalanceIncreased(
                this,
                classicAddress,
                startingBalance
              );

              if (isFunded) {
                resolve(wallet);
              } else {
                reject(
                  new errors.XRPLFaucetError(
                    `Unable to fund address with faucet after waiting ${
                      INTERVAL_SECONDS * MAX_ATTEMPTS
                    } seconds`
                  )
                );
              }
            } catch (err) {
              reject(new errors.XRPLFaucetError(err));
            }
          } else {
            reject(
              new errors.XRPLFaucetError(
                `The faucet account classic address is undefined`
              )
            );
          }
        } else {
          reject({
            statusCode: response.statusCode,
            contentType: response.headers["content-type"],
            body,
          });
        }
      });
    });
    // POST the body
    request.write(body || "");

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });
}

/**
 * Retrieves an XRPL address XRP balance.
 *
 * @param client - Client.
 * @param address - XRPL address.
 * @returns
 */
async function getAddressXrpBalance(
  client: Client,
  address: string
): Promise<string> {
  // Get all the account balances
  try {
    const balances = await client.getBalances(address);

    // Retrieve the XRP balance
    const xrpBalance = balances.filter(
      (balance) => balance.currency.toUpperCase() === "XRP"
    );
    return xrpBalance[0].value;
  } catch (err) {
    return `Unable to retrieve ${address} balance. Error: ${err}`;
  }
}

/**
 * Check at regular interval if the address is enabled on the XRPL and funded.
 *
 * @param client - Client.
 * @param address - The account address to check.
 * @param originalBalance - The initial balance before the funding.
 * @returns A Promise boolean.
 */
async function hasAddressBalanceIncreased(
  client: Client,
  address: string,
  originalBalance: number
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let attempts = MAX_ATTEMPTS;
    const interval = setInterval(async () => {
      if (attempts < 0) {
        clearInterval(interval);
        resolve(false);
      } else {
        attempts--;
      }

      try {
        const newBalance = Number(await getAddressXrpBalance(client, address));
        if (newBalance > originalBalance) {
          clearInterval(interval);
          resolve(true);
        }
      } catch (err) {
        clearInterval(interval);
        reject(
          new errors.XRPLFaucetError(
            `Unable to check if the address ${address} balance has increased. Error: ${err}`
          )
        );
      }
    }, INTERVAL_SECONDS * 1000);
  });
}

/**
 * Get the faucet URL based on the Client connection.
 *
 * @param client - Client.
 * @returns A {@link FaucetNetwork}.
 */
export function getFaucetUrl(client: Client) {
  const connectionUrl = client.connection.getUrl();

  // 'altnet' for Ripple Testnet server and 'testnet' for XRPL Labs Testnet server
  if (connectionUrl.includes("altnet") || connectionUrl.includes("testnet")) {
    return FaucetNetwork.Testnet;
  }

  if (connectionUrl.includes("devnet")) {
    return FaucetNetwork.Devnet;
  }

  return undefined;
}

export default generateFaucetWallet;
