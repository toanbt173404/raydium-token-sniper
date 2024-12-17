"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swap = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const bs58_1 = __importDefault(require("bs58"));
const dotenv_1 = require("dotenv");
const decimal_js_1 = __importDefault(require("decimal.js"));
const spl_token_1 = require("@solana/spl-token");
const helper_1 = require("./utils/helper");
const config_1 = require("./config");
const web3_js_1 = require("@solana/web3.js");
(0, dotenv_1.config)();
const owner = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(process.env.WALLET_PRIVATE_KEY));
const connection = new web3_js_1.Connection(process.env.RPC_ENDPOINT, "confirmed");
const swap = (poolId) => __awaiter(void 0, void 0, void 0, function* () {
    const raydium = yield (0, config_1.initSdk)(connection, owner);
    const amountIn = 500;
    const inputMint = spl_token_1.NATIVE_MINT.toBase58();
    let poolInfo;
    let poolKeys;
    let rpcData;
    if (raydium.cluster === "mainnet") {
        const data = yield raydium.api.fetchPoolById({ ids: poolId });
        poolInfo = data[0];
        if (!(0, helper_1.isValidAmm)(poolInfo.programId)) {
            throw new Error("target pool is not AMM pool");
        }
        poolKeys = yield raydium.liquidity.getAmmPoolKeys(poolId);
        rpcData = yield raydium.liquidity.getRpcPoolInfo(poolId);
    }
    else {
        const data = yield raydium.liquidity.getPoolInfoFromRpc({ poolId });
        poolInfo = data.poolInfo;
        poolKeys = data.poolKeys;
        rpcData = data.poolRpcData;
    }
    const [baseReserve, quoteReserve, status] = [
        rpcData.baseReserve,
        rpcData.quoteReserve,
        rpcData.status.toNumber(),
    ];
    if (!poolInfo) {
        return;
    }
    if (poolInfo &&
        poolInfo.mintA.address !== inputMint &&
        poolInfo.mintB.address !== inputMint)
        throw new Error("input mint does not match pool");
    const baseIn = inputMint === poolInfo.mintA.address;
    const [mintIn, mintOut] = baseIn
        ? [poolInfo.mintA, poolInfo.mintB]
        : [poolInfo.mintB, poolInfo.mintA];
    const out = raydium.liquidity.computeAmountOut({
        poolInfo: Object.assign(Object.assign({}, poolInfo), { baseReserve,
            quoteReserve,
            status, version: 4 }),
        amountIn: new bn_js_1.default(amountIn),
        mintIn: mintIn.address,
        mintOut: mintOut.address,
        slippage: 0.01, // range: 1 ~ 0.0001, means 100% ~ 0.01%
    });
    console.log(`computed swap ${new decimal_js_1.default(amountIn)
        .div(Math.pow(10, mintIn.decimals))
        .toDecimalPlaces(mintIn.decimals)
        .toString()} ${mintIn.symbol || mintIn.address} to ${new decimal_js_1.default(out.amountOut.toString())
        .div(Math.pow(10, mintOut.decimals))
        .toDecimalPlaces(mintOut.decimals)
        .toString()} ${mintOut.symbol || mintOut.address}, minimum amount out ${new decimal_js_1.default(out.minAmountOut.toString())
        .div(Math.pow(10, mintOut.decimals))
        .toDecimalPlaces(mintOut.decimals)} ${mintOut.symbol || mintOut.address}`);
    const { execute } = yield raydium.liquidity.swap({
        poolInfo,
        poolKeys,
        amountIn: new bn_js_1.default(amountIn),
        amountOut: out.minAmountOut, // out.amountOut means amount 'without' slippage
        fixedSide: "in",
        inputMint: mintIn.address,
        txVersion: config_1.txVersion,
        // optional: set up token account
        // config: {
        //   inputUseSolBalance: true, // default: true, if you want to use existed wsol token account to pay token in, pass false
        //   outputUseSolBalance: true, // default: true, if you want to use existed wsol token account to receive token out, pass false
        //   associatedOnly: true, // default: true, if you want to use ata only, pass true
        // },
        // optional: set up priority fee here
        computeBudgetConfig: {
            units: 60000,
            microLamports: 100000000,
        },
    });
    (0, helper_1.printSimulateInfo)();
    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const { txId } = yield execute({ sendAndConfirm: true });
    console.log(`swap successfully in amm pool:`, {
        txId: `https://explorer.solana.com/tx/${txId}`,
    });
    process.exit(); // if you don't want to end up node execution, comment this line
});
exports.swap = swap;
//# sourceMappingURL=swapAmm.js.map