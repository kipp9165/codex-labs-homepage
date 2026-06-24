const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const OUTPUT_JSON = path.resolve(__dirname, "../public/checkout-urls.json");

function sortObjectKeys(obj) {
	return Object.fromEntries(
		Object.keys(obj)
			.sort()
			.map((key) => [key, obj[key]])
	);
}

function buildCheckoutUrls(records) {
	const grouped = new Map();

	for (const row of records) {
		if (!row.productId || !row.priceId || !row.paymentLinkUrl) {
			continue;
		}

		if (!grouped.has(row.productId)) {
			grouped.set(row.productId, {
				name: row.productName,
				prices: [],
			});
		}

		const product = grouped.get(row.productId);
		if (!product.name) {
			product.name = row.productName;
		}

		product.prices.push({
			price_id: row.priceId,
			amount: row.amount,
			currency: row.currency,
			payment_link_url: row.paymentLinkUrl,
		});
	}

	const checkoutUrls = {};
	const sortedProductIds = Array.from(grouped.keys()).sort();

	for (const productId of sortedProductIds) {
		const product = grouped.get(productId);
		const dedupedPrices = [];
		const seen = new Set();

		for (const price of product.prices) {
			const key = `${price.price_id}|${price.payment_link_url}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			dedupedPrices.push(price);
		}

		dedupedPrices.sort((a, b) => {
			if (a.amount !== b.amount) {
				return a.amount - b.amount;
			}
			return a.price_id.localeCompare(b.price_id);
		});

		const primary = dedupedPrices[0];

		if (dedupedPrices.length === 1) {
			checkoutUrls[productId] = {
				product_name: product.name,
				price_id: primary.price_id,
				amount: primary.amount,
				currency: primary.currency,
				payment_link_url: primary.payment_link_url,
			};
		} else {
			checkoutUrls[productId] = {
				product_name: product.name,
				price_id: primary.price_id,
				amount: primary.amount,
				currency: primary.currency,
				payment_link_url: primary.payment_link_url,
				prices: dedupedPrices,
			};
		}
	}

	return sortObjectKeys(checkoutUrls);
}

async function main() {
	const loaderModulePath = path.resolve(__dirname, "../load-codex-csv.js");
	const loader = await import(pathToFileURL(loaderModulePath).href);
	const records = loader.getAllProducts();
	const checkoutUrls = buildCheckoutUrls(records);

	fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(checkoutUrls, null, 2)}\n`, "utf8");

	const productCount = Object.keys(checkoutUrls).length;
	console.log(`Generated ${OUTPUT_JSON}`);
	console.log(`Rows parsed: ${records.length}`);
	console.log(`Products written: ${productCount}`);
}

main().catch((error) => {
	console.error("Failed generating checkout-urls.json:", error.message);
	process.exit(1);
});
