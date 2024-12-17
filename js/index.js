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
const ws_1 = __importDefault(require("ws"));
const web3_js_1 = require("@solana/web3.js");
const raydium_sdk_v2_1 = require("@raydium-io/raydium-sdk-v2");
const swapAmm_1 = require("./swapAmm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const connection = new web3_js_1.Connection(process.env.RPC_ENDPOINT, "processed");
const webSocketString = process.env.SOCKET_ENDPOINT;
const ws = new ws_1.default(webSocketString);
const rayProgram = new web3_js_1.PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
const openMarketProgram = new web3_js_1.PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
const tokenSniper = new web3_js_1.PublicKey('2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv');
ws.onopen = () => {
    ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "blockSubscribe",
        params: [
            {
                mentionsAccountOrProgram: openMarketProgram.toString()
            },
            {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
                encoding: "jsonParsed",
            },
        ],
    }));
};
ws.on('message', (evt) => {
    try {
        const buffer = evt.toString('utf8');
        console.log('buffer: ', buffer);
        parseTxs(JSON.parse(buffer));
        // parseLogsV2(JSON.parse(buffer));
        return;
    }
    catch (e) {
        console.log(e);
    }
});
function parseTxs(txsFromBlock) {
    if (txsFromBlock.params === undefined) {
        return;
    }
    const allTx = txsFromBlock.params.result.value.block.transactions;
    for (const tx of allTx) {
        if (parseLogs(tx.meta.logMessages) && tx.transaction.message.accountKeys.length === 13 && tx.transaction.message.instructions.length === 6) {
            ws.close();
            console.log(tx.transaction.signatures);
            parseAccountKeys(tx.transaction.message.accountKeys, tx.transaction.signatures);
        }
    }
}
function parseLogs(logs) {
    let invoke = 0;
    let consumed = 0;
    let success = 0;
    for (const log of logs) {
        if (log.includes("Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX invoke")) {
            invoke += 1;
        }
        if (log.includes("Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX consumed")) {
            consumed += 1;
        }
        if (log.includes("Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX success")) {
            success += 1;
        }
    }
    if (invoke === 1 && consumed === 1 && success === 1) {
        return true;
    }
    else {
        return false;
    }
}
function parseLogsV2(buffer) {
    if (buffer.params === undefined) {
        return;
    }
    let now = new Date();
    let utcString = now.toUTCString();
    console.log(utcString);
    const allLogs = buffer.params.result.value.logs;
    for (const log of allLogs) {
        if (log.includes("ray_log")) {
            const rayLogSplit = log.split(" ");
            const rayLog = rayLogSplit[3];
            const logData = Buffer.from(rayLog, "base64");
            const market = new web3_js_1.PublicKey(logData.subarray(75 - 32));
            const pool = (0, raydium_sdk_v2_1.findProgramAddress)([rayProgram.toBuffer(), market.toBuffer(), Buffer.from('amm_associated_seed', 'utf-8')], rayProgram)['publicKey'];
        }
    }
}
function parseAccountKeys(keys, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        let marketId = null;
        for (const key of keys) {
            console.log(key);
            const keyData = yield connection.getAccountInfo(new web3_js_1.PublicKey(key.pubkey));
            if (keyData !== null && keyData.data.length === 388) {
                marketId = key.pubkey;
            }
        }
        if (marketId === null) {
            parseAccountKeys(keys);
        }
        else {
            console.log('marketId: ', marketId);
            yield (0, swapAmm_1.swap)(marketId);
        }
    });
}
//# sourceMappingURL=index.js.map