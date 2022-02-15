import { Keypair } from '@solana/web3.js';
import {PRIVATE_KEY_DEFAULT_ACCOUNT} from '../constants/defaultWallet';
import bs58 from "bs58";

export const getDefaultAccount = () => {
    const decoded = bs58.decode(PRIVATE_KEY_DEFAULT_ACCOUNT);
    const defaultAcc = Keypair.fromSecretKey(decoded)
    return defaultAcc;
}