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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTokenAccountData = exports.initSdk = exports.txVersion = void 0;
const raydium_sdk_v2_1 = require("@raydium-io/raydium-sdk-v2");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
// export const connection = new Connection(clusterApiUrl('devnet')) //<YOUR_RPC_URL>
exports.txVersion = raydium_sdk_v2_1.TxVersion.V0;
const cluster = 'mainnet'; // 'mainnet' | 'devnet'
let raydium;
const initSdk = (connection, owner, params) => __awaiter(void 0, void 0, void 0, function* () {
    if (raydium)
        return raydium;
    if (connection.rpcEndpoint === (0, web3_js_1.clusterApiUrl)('mainnet-beta'))
        console.warn('using free rpc node might cause unexpected error, strongly suggest uses paid rpc node');
    console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`);
    raydium = yield raydium_sdk_v2_1.Raydium.load({
        owner,
        connection,
        cluster,
        disableFeatureCheck: true,
        disableLoadToken: !(params === null || params === void 0 ? void 0 : params.loadToken),
        blockhashCommitment: 'finalized',
    });
    return raydium;
});
exports.initSdk = initSdk;
const fetchTokenAccountData = (connection, owner) => __awaiter(void 0, void 0, void 0, function* () {
    const solAccountResp = yield connection.getAccountInfo(owner.publicKey);
    const tokenAccountResp = yield connection.getTokenAccountsByOwner(owner.publicKey, { programId: spl_token_1.TOKEN_PROGRAM_ID });
    const token2022Req = yield connection.getTokenAccountsByOwner(owner.publicKey, { programId: spl_token_1.TOKEN_2022_PROGRAM_ID });
    const tokenAccountData = (0, raydium_sdk_v2_1.parseTokenAccountResp)({
        owner: owner.publicKey,
        solAccountResp,
        tokenAccountResp: {
            context: tokenAccountResp.context,
            value: [...tokenAccountResp.value, ...token2022Req.value],
        },
    });
    return tokenAccountData;
});
exports.fetchTokenAccountData = fetchTokenAccountData;
//# sourceMappingURL=config.js.map