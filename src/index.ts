import WebSocket from "ws";
import { Connection, PublicKey } from "@solana/web3.js";
import { findProgramAddress } from "@raydium-io/raydium-sdk-v2";
import { swap } from "./swapAmm";
import {config } from 'dotenv';
config()
const connection = new Connection(
    process.env.RPC_ENDPOINT!,
    "processed"
  );
const webSocketString = process.env.SOCKET_ENDPOINT!;
const ws = new WebSocket(webSocketString);

const rayProgram = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
const openMarketProgram = new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX')
const tokenSniper = new PublicKey('2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv');

ws.onopen = () => {
  ws.send(
    JSON.stringify({
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
    })
  );
};


ws.on('message', (evt) => {
    try {
        const buffer = evt.toString('utf8');
        console.log('buffer: ', buffer)
        parseTxs(JSON.parse(buffer));
        // parseLogsV2(JSON.parse(buffer));

        return;
    } catch (e) {
        console.log(e)
    }
})

function parseTxs(txsFromBlock: any){
    if(txsFromBlock.params === undefined){
        return;
    }
    const allTx = txsFromBlock.params.result.value.block.transactions;
    for(const tx of allTx){
        if(parseLogs(tx.meta.logMessages) && tx.transaction.message.accountKeys.length === 13 && tx.transaction.message.instructions.length === 6){
            ws.close();
            console.log(tx.transaction.signatures)
            parseAccountKeys(tx.transaction.message.accountKeys, tx.transaction.signatures);
        }
    }
}

function parseLogs(logs: any){
    let invoke = 0;
    let consumed = 0;
    let success = 0;
    for(const log of logs){
        if(log.includes("Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX invoke")){
            invoke += 1;
        }
        if(log.includes("Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX consumed")){
            consumed += 1;
        }
        if(log.includes("Program srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX success")){
            success += 1;
        }
    }
    if(invoke === 1 && consumed === 1 && success === 1){
        return true;
    } else{
        return false;
    }
}

function parseLogsV2(buffer: any){
    if(buffer.params === undefined){
        return;
    }
    let now = new Date();
    let utcString = now.toUTCString();
    console.log(utcString);
    const allLogs = buffer.params.result.value.logs;
    for(const log of allLogs){
        if(log.includes("ray_log")){
            const rayLogSplit = log.split(" ");
            const rayLog = rayLogSplit[3];
            const logData = Buffer.from(rayLog, "base64");
            const market = new PublicKey(logData.subarray(75 - 32));
            const pool = findProgramAddress([rayProgram.toBuffer(), market.toBuffer(), Buffer.from('amm_associated_seed', 'utf-8')], rayProgram)['publicKey'];
        }
    }
}

async function parseAccountKeys(keys: any, signature?: any){
    let marketId = null;
    for(const key of keys){
        console.log(key);
        const keyData = await connection.getAccountInfo(new PublicKey(key.pubkey));
        if(keyData !== null && keyData.data.length === 388){
            marketId = key.pubkey;
        }
    }
    if(marketId === null){
        parseAccountKeys(keys);
    } else {
        console.log('marketId: ', marketId)
        await swap(marketId)
    }
}