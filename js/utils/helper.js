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
exports.printSimulateInfo = exports.isValidAmm = void 0;
exports.getTokenPriceInSol = getTokenPriceInSol;
const web3_js_1 = require("@solana/web3.js");
const raydium_sdk_v2_1 = require("@raydium-io/raydium-sdk-v2");
const VALID_PROGRAM_ID = new Set([
    raydium_sdk_v2_1.AMM_V4.toBase58(),
    raydium_sdk_v2_1.AMM_STABLE.toBase58(),
    raydium_sdk_v2_1.DEVNET_PROGRAM_ID.AmmV4.toBase58(),
    raydium_sdk_v2_1.DEVNET_PROGRAM_ID.AmmStable.toBase58(),
]);
const isValidAmm = (id) => VALID_PROGRAM_ID.has(id);
exports.isValidAmm = isValidAmm;
function getTokenPriceInSol(connection, baseVault, quoteVault) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseVaultAccount = yield connection.getTokenAccountBalance(new web3_js_1.PublicKey(baseVault));
        const quoteVaultAccount = yield connection.getTokenAccountBalance(new web3_js_1.PublicKey(quoteVault));
        const baseVaultAccountAmount = baseVaultAccount.value.uiAmount || 1;
        const quoteVaultAccountAmount = quoteVaultAccount.value.uiAmount || 0;
        return quoteVaultAccountAmount / baseVaultAccountAmount;
    });
}
const printSimulateInfo = () => {
    console.log('you can paste simulate tx string here: https://explorer.solana.com/tx/inspector and click simulate to check transaction status');
    console.log('if tx simulate successful but did not went through successfully after running execute(xxx), usually means your txs were expired, try set up higher priority fees');
    console.log('strongly suggest use paid rpcs would get you better performance');
};
exports.printSimulateInfo = printSimulateInfo;
//# sourceMappingURL=helper.js.map