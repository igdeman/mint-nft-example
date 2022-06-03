import * as fs from 'fs';
import * as path from 'path';
import Bundlr from '@bundlr-network/client';

async function main() {
	const privateKey = JSON.parse(fs.readFileSync('<your_wallet_path.json>').toString());
	const bundlr = new Bundlr('https://devnet.bundlr.network', 'solana', privateKey, {
		providerUrl: 'https://api.devnet.solana.com'
	});
	const asset = fs.readFileSync('<Your_asset_path.jpg>');
	const cost = await bundlr.getPrice(asset.byteLength);
	const fundTX = await bundlr.fund(cost);

	const uploadTX = bundlr.createTransaction(asset, {
		tags: [{
			name: 'Content-Type',
			value: 'image/jpg',
		}]
	});
	await uploadTX.sign();
	const result = await uploadTX.upload();
	console.log(result.data.id);
}
main();