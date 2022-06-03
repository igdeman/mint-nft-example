import * as fs from 'fs';
import { ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import { BinaryReader, BinaryWriter, serialize } from 'borsh';
import { CreateMetadataArgs, Creator, Data, METADATA_SCHEMA, METAPLEX_METADATA_PROGRAM } from './metaplex';

async function main() {
	console.log("Minting your NFT, please be patient :)");

	const rpc = 'https://api.devnet.solana.com';
	const connection: Connection = new Connection(rpc);
	const wallet: Keypair = Keypair.fromSecretKey(
		new Uint8Array(JSON.parse(fs.readFileSync('<your_wallet_path.json>').toString())),
	);
	const mint = Keypair.generate();
	const [tokenAccount, tokenBump] = await PublicKey.findProgramAddress(
		[
			wallet.publicKey.toBuffer(),
			TOKEN_PROGRAM_ID.toBuffer(),
			mint.publicKey.toBuffer()
		],
		ASSOCIATED_TOKEN_PROGRAM_ID
	);

	const transaction = new Transaction();
	transaction.add(
		SystemProgram.createAccount({
			fromPubkey: wallet.publicKey,
			newAccountPubkey: mint.publicKey,
			lamports: await connection.getMinimumBalanceForRentExemption(MintLayout.span),
			space: MintLayout.span,
			programId: TOKEN_PROGRAM_ID,
		}),
		Token.createInitMintInstruction(
			TOKEN_PROGRAM_ID,
			mint.publicKey,
			0,
			wallet.publicKey,
			wallet.publicKey,
		),
		new TransactionInstruction({
			keys: [
				{
					pubkey: wallet.publicKey,
					isSigner: true,
					isWritable: true,
				},
				{
					pubkey: tokenAccount,
					isSigner: false,
					isWritable: true,
				},
				{
					pubkey: wallet.publicKey,
					isSigner: false,
					isWritable: false,
				},
				{
					pubkey: mint.publicKey,
					isSigner: false,
					isWritable: false,
				},
				{
					pubkey: SystemProgram.programId,
					isSigner: false,
					isWritable: false,
				},
				{
					pubkey: TOKEN_PROGRAM_ID,
					isSigner: false,
					isWritable: false,
				},
				{
					pubkey: SYSVAR_RENT_PUBKEY,
					isSigner: false,
					isWritable: false,
				},
			],
			programId: ASSOCIATED_TOKEN_PROGRAM_ID,
			data: Buffer.from([]),
		})
	);

	// Metaplex Metadata
	const [tokenMetadata, metadataBump] = await PublicKey.findProgramAddress(
		[
			Buffer.from('metadata'),
			METAPLEX_METADATA_PROGRAM.toBuffer(),
			mint.publicKey.toBuffer(),
		],
		METAPLEX_METADATA_PROGRAM
	);
	const metadata = Buffer.from(serialize(METADATA_SCHEMA, new CreateMetadataArgs({
		data: new Data({
			name: "<NFT title>",
			symbol: "<NFT symbol>",
			uri: "https://arweave.net/<bundlr TX>", // url to the json file
			sellerFeeBasisPoints: 500,
			creators: [new Creator({
				address: wallet.publicKey,
				verified: true,
				share: 100
			})]
		}),
		isMutable: true
	})));

	transaction.add(
		new TransactionInstruction({
			keys: [
				{
					pubkey: tokenMetadata,
					isSigner: false,
					isWritable: true,
				},
				{
					pubkey: mint.publicKey,
					isSigner: false,
					isWritable: false,
				},
				{
					pubkey: wallet.publicKey, // Mint Authority
					isSigner: true,
					isWritable: false,
				},
				{
					pubkey: wallet.publicKey, // Payer
					isSigner: true,
					isWritable: false,
				},
				{
					pubkey: wallet.publicKey, //  Update Authority
					isSigner: false,
					isWritable: false,
				},
				{
					pubkey: SystemProgram.programId,
					isSigner: false,
					isWritable: false,
				},
				{
					pubkey: SYSVAR_RENT_PUBKEY,
					isSigner: false,
					isWritable: false,
				},
			],
			programId: METAPLEX_METADATA_PROGRAM,
			data: metadata,
		})
	);
	transaction.add(
		Token.createMintToInstruction(
			TOKEN_PROGRAM_ID,
			new PublicKey(mint.publicKey),
			new PublicKey(tokenAccount),
			new PublicKey(wallet.publicKey),
			[],
			1,
		),
	);

	transaction.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
	transaction.sign(wallet, mint);
	const tx = await connection.sendRawTransaction(transaction.serialize(), {
		preflightCommitment: "singleGossip",
		skipPreflight: false,
	});
	const confirmationResult = await connection.confirmTransaction(tx, "confirmed");
	if (confirmationResult.value.err === null)
		console.log(`Confirmation succeded! Your NFT ${mint.publicKey.toBase58()}`)
}

function extendBorsh() {
	(BinaryReader.prototype as any).readPubkey = function () {
		const reader = this as unknown as BinaryReader;
		const array = reader.readFixedArray(32);
		return new PublicKey(array);
	};
	(BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
		const writer = this as unknown as BinaryWriter;
		writer.writeFixedArray(value.toBuffer());
	};
}

extendBorsh();
main();