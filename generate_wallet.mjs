import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("---------------------------------------------------");
console.log("🔐 NEW AGENT WALLET GENERATED");
console.log("---------------------------------------------------");
console.log("📍 Address:    " + account.address);
console.log("🔑 Private Key: " + privateKey);
console.log("---------------------------------------------------");
console.log("⚠️  SAVE THIS PRIVATE KEY SECURELY! DO NOT SHARE IT.");
