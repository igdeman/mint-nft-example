import { PublicKey } from "@solana/web3.js";

export const METADATA_PREFIX = 'metadata';
export const METAPLEX_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const LAMPORT_MULTIPLIER = 10 ** 9;
export const WINSTON_MULTIPLIER = 10 ** 12;

export class Creator {
	address: PublicKey;
	verified: boolean;
	share: number;

	constructor(args: {
		address: PublicKey;
		verified: boolean;
		share: number;
	}) {
		this.address = args.address;
		this.verified = args.verified;
		this.share = args.share;
	}
}

export class Data {
	name: string;
	symbol: string;
	uri: string;
	sellerFeeBasisPoints: number;
	creators: Creator[] | null;
	constructor(args: {
		name: string;
		symbol: string;
		uri: string;
		sellerFeeBasisPoints: number;
		creators: Creator[] | null;
	}) {
		this.name = args.name;
		this.symbol = args.symbol;
		this.uri = args.uri;
		this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
		this.creators = args.creators;
	}
}

export class CreateMetadataArgs {
	instruction: number = 0;
	data: Data;
	isMutable: boolean;

	constructor(args: { data: Data; isMutable: boolean }) {
		this.data = args.data;
		this.isMutable = args.isMutable;
	}
}


export const METADATA_SCHEMA = new Map<any, any>([
	[
		CreateMetadataArgs,
		{
			kind: 'struct',
			fields: [
				['instruction', 'u8'],
				['data', Data],
				['isMutable', 'u8'], // bool
			],
		},
	],
	[
		Data,
		{
			kind: 'struct',
			fields: [
				['name', 'string'],
				['symbol', 'string'],
				['uri', 'string'],
				['sellerFeeBasisPoints', 'u16'],
				['creators', { kind: 'option', type: [Creator] }],
			],
		},
	],
	[
		Creator,
		{
			kind: 'struct',
			fields: [
				['address', 'pubkey'],
				['verified', 'u8'],
				['share', 'u8'],
			],
		},
	],
]);
