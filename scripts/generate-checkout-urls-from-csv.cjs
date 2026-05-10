const fs = require("fs");
const path = require("path");

const INPUT_CSV = path.resolve(__dirname, "../tools/codex_all_payment_links.csv");
const OUTPUT_JSON = path.resolve(__dirname, "../public/checkout-urls.json");

const REPLACEMENTS = [
	["\u00E2\u20AC\u201D", "\u2014"],
	["\u00E2\u20AC\u2018", "\u2011"],
	["\u00E2\u20AC\u2122", "\u2019"],
	["\u00E2\u20AC\u0153", "\u201C"],
	["\u00E2\u20AC\u009D", "\u201D"],
	["\u00E2\u20AC\u201C", "\u2013"],
	["\u00E2\u20AC\u00A6", "\u2026"],
	["\u00C2", ""],
];

function normalizeText(text) {
	let normalized = (text || "").trim();
	for (const [bad, good] of REPLACEMENTS) {
		normalized = normalized.split(bad).join(good);
	}
	return normalized;
}

function parseCsvLine(line) {
	const cells = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i += 1) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === "," && !inQuotes) {
			cells.push(current);
			current = "";
			continue;
		}

		current += char;
	}

	cells.push(current);
	return cells;
}

function parseCsv(csvText) {
	const lines = csvText
		.replace(/^\uFEFF/, "")
		.split(/\r?\n/)
		.filter((line) => line.trim().length > 0);

	if (!lines.length) {
		throw new Error("CSV is empty");
	}

	const headers = parseCsvLine(lines[0]).map((h) => h.trim());
	const expected = ["product_name", "product_id", "price_id", "amount", "currency", "payment_link_url"];

	if (headers.join(",") !== expected.join(",")) {
		throw new Error(`Unexpected CSV header. Received: ${headers.join(",")}`);
	}

	const records = [];
	for (let i = 1; i < lines.length; i += 1) {
		const line = lines[i];
		const cells = parseCsvLine(line);
		if (cells.length !== expected.length) {
			throw new Error(`Invalid CSV row at line ${i + 1}: expected ${expected.length} columns, got ${cells.length}`);
		}

		const amount = Number.parseFloat(cells[3]);
		if (!Number.isFinite(amount)) {
			throw new Error(`Invalid amount at line ${i + 1}: ${cells[3]}`);
		}

		records.push({
			product_name: normalizeText(cells[0]),
			product_id: cells[1].trim(),
			price_id: cells[2].trim(),
			amount,
			currency: cells[4].trim().toLowerCase(),
			payment_link_url: cells[5].trim(),
		});
	}

	return records;
}

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
		if (!row.product_id || !row.price_id || !row.payment_link_url) {
			continue;
		}

		if (!grouped.has(row.product_id)) {
			grouped.set(row.product_id, {
				name: row.product_name,
				prices: [],
			});
		}

		const product = grouped.get(row.product_id);
		if (!product.name) {
			product.name = row.product_name;
		}

		product.prices.push({
			price_id: row.price_id,
			amount: row.amount,
			currency: row.currency,
			payment_link_url: row.payment_link_url,
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

		if (dedupedPrices.length === 1) {
			checkoutUrls[productId] = {
				name: product.name,
				price_id: dedupedPrices[0].price_id,
				amount: dedupedPrices[0].amount,
				currency: dedupedPrices[0].currency,
				payment_link_url: dedupedPrices[0].payment_link_url,
			};
		} else {
			checkoutUrls[productId] = {
				name: product.name,
				prices: dedupedPrices,
			};
		}
	}

	return sortObjectKeys(checkoutUrls);
}

function main() {
	const csvText = fs.readFileSync(INPUT_CSV, "utf8");
	const records = parseCsv(csvText);
	const checkoutUrls = buildCheckoutUrls(records);

	fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(checkoutUrls, null, 2)}\n`, "utf8");

	const productCount = Object.keys(checkoutUrls).length;
	console.log(`Generated ${OUTPUT_JSON}`);
	console.log(`Rows parsed: ${records.length}`);
	console.log(`Products written: ${productCount}`);
}

main();
