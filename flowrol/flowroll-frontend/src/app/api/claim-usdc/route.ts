import { NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, parseUnits, erc20Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ACTIVE_CHAIN, RPC, USDC_DECIMALS } from '@/lib/chain';
import { getContractsForChain } from '@/lib/contracts/addresses';

export async function POST(req: Request) {
    try {
        const { address, chainId } = await req.json();

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        if (!chainId) {
            return NextResponse.json({ error: 'Chain ID is required' }, { status: 400 });
        }

        // Server-only secret. (Was NEXT_PUBLIC_FAUCET_PRIVATE_KEY, which leaked
        // the key into the browser bundle.) Testnet-only faucet wallet.
        const privateKey = process.env.FAUCET_PRIVATE_KEY;
        if (!privateKey) {
            console.error("FAUCET_PRIVATE_KEY missing in environment variables");
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        if (Number(chainId) !== ACTIVE_CHAIN.id) {
            return NextResponse.json({ error: `Unsupported chain ${chainId}` }, { status: 400 });
        }
        const targetChain = ACTIVE_CHAIN;
        const contracts = getContractsForChain(targetChain.id.toString());
        const usdcAddress = contracts.USDC_ADDRESS;
        
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        const publicClient = createPublicClient({
            chain: targetChain as any,
            transport: http(RPC)
        });

        const walletClient = createWalletClient({
            account,
            chain: targetChain as any,
            transport: http(RPC) 
        });

        const txHash = await walletClient.writeContract({
            address: usdcAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [address as `0x${string}`, parseUnits("2000", USDC_DECIMALS)],
            chain: targetChain as any
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });

        return NextResponse.json({ success: true, txHash });

    } catch (error: any) {
        console.error("USDC Claim error:", error);
        return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
    }
}