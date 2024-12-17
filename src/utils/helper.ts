import { Connection, PublicKey } from "@solana/web3.js";
import { AMM_V4, AMM_STABLE, DEVNET_PROGRAM_ID } from '@raydium-io/raydium-sdk-v2'

const VALID_PROGRAM_ID = new Set([
  AMM_V4.toBase58(),
  AMM_STABLE.toBase58(),
  DEVNET_PROGRAM_ID.AmmV4.toBase58(),
  DEVNET_PROGRAM_ID.AmmStable.toBase58(),
])

export const isValidAmm = (id: string) => VALID_PROGRAM_ID.has(id)


export async function getTokenPriceInSol(connection: Connection, baseVault: string, quoteVault: string) {
  const baseVaultAccount = await connection.getTokenAccountBalance(
    new PublicKey(baseVault)
  );
  const quoteVaultAccount = await connection.getTokenAccountBalance(
    new PublicKey(quoteVault)
  );
  const baseVaultAccountAmount = baseVaultAccount.value.uiAmount || 1;
  const quoteVaultAccountAmount = quoteVaultAccount.value.uiAmount || 0;
  return quoteVaultAccountAmount / baseVaultAccountAmount;
}

export const printSimulateInfo = () => {
    console.log(
      'you can paste simulate tx string here: https://explorer.solana.com/tx/inspector and click simulate to check transaction status'
    )
    console.log(
      'if tx simulate successful but did not went through successfully after running execute(xxx), usually means your txs were expired, try set up higher priority fees'
    )
    console.log('strongly suggest use paid rpcs would get you better performance')
  }
  