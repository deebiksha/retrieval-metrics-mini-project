
const fs = require("fs");
const path = require("path");

const TEST_SET_PATH = path.join(__dirname, "test-set.csv");
const SEARCH_RESULTS_PATH = path.join(__dirname, "search-results.json");
const K = 10;

// Parse a CSV line, including quoted fields and escaped quotes.
function parseCSVLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }

  fields.push(field);
  return fields;
}

// Load queries and all their correct post IDs.
function loadTestSet() {
  const content = fs.readFileSync(TEST_SET_PATH, "utf8").trim();

  if (!content) {
    throw new Error("test-set.csv is empty.");
  }

  const lines = content.split(/\r?\n/);
  const headers = parseCSVLine(lines.shift()).map(h => h.trim());

  const queryIndex = headers.indexOf("query");
  const correctIdsIndex = headers.indexOf("correct_post_ids");

  if (queryIndex === -1 || correctIdsIndex === -1) {
    throw new Error(
      'CSV must contain "query" and "correct_post_ids" columns.'
    );
  }

  return lines
    .filter(line => line.trim() !== "")
    .map((line, index) => {
      const fields = parseCSVLine(line);
      const query = fields[queryIndex]?.trim();
      const correctIdsText = fields[correctIdsIndex]?.trim();

      if (!query || !correctIdsText) {
        throw new Error(`Invalid CSV data on row ${index + 2}.`);
      }

      const correctIds = correctIdsText
        .split(";")
        .map(id => id.trim())
        .filter(Boolean)
        .map(Number);

      if (
        correctIds.length === 0 ||
        correctIds.some(id => !Number.isFinite(id))
      ) {
        throw new Error(`Invalid correct post IDs on row ${index + 2}.`);
      }

      return {
        query,
        correct_post_ids: correctIds
      };
    });
}

// Convert a result into a numeric post ID.
// Supports either [1002, 1033] or [{ post_id: 1002 }].
function getPostId(result) {
  const value =
    result !== null && typeof result === "object"
      ? result.post_id
      : result;

  return Number(value);
}

// Return 1/rank for the first correct result, or 0 if not found.
function reciprocalRank(results, correctIds) {
  for (let i = 0; i < results.length; i++) {
    const postId = getPostId(results[i]);

    if (correctIds.includes(postId)) {
      return 1 / (i + 1);
    }
  }

  return 0;
}

// Return the rank of the first correct result, or "miss".
function findRank(results, correctIds) {
  for (let i = 0; i < results.length; i++) {
    const postId = getPostId(results[i]);

    if (correctIds.includes(postId)) {
      return i + 1;
    }
  }

  return "miss";
}

function mean(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function main() {
  const testSet = loadTestSet();
  const searchResults = JSON.parse(
    fs.readFileSync(SEARCH_RESULTS_PATH, "utf8")
  );

  const keywordRRs = [];
  const semanticRRs = [];

  let keywordHits = 0;
  let semanticHits = 0;

  console.log("| Query | Keyword rank | Semantic rank |");
  console.log("|---|---:|---:|");

  for (const item of testSet) {
    const queryResults = searchResults[item.query];

    if (
      !queryResults ||
      !Array.isArray(queryResults.keyword) ||
      !Array.isArray(queryResults.semantic)
    ) {
      throw new Error(
        `Missing keyword or semantic results for query: ${item.query}`
      );
    }

    // Only evaluate the top 10 results.
    const keywordResults = queryResults.keyword.slice(0, K);
    const semanticResults = queryResults.semantic.slice(0, K);

    const keywordRR = reciprocalRank(
      keywordResults,
      item.correct_post_ids
    );

    const semanticRR = reciprocalRank(
      semanticResults,
      item.correct_post_ids
    );

    const keywordRank = findRank(
      keywordResults,
      item.correct_post_ids
    );

    const semanticRank = findRank(
      semanticResults,
      item.correct_post_ids
    );

    keywordRRs.push(keywordRR);
    semanticRRs.push(semanticRR);

    if (keywordRR > 0) keywordHits++;
    if (semanticRR > 0) semanticHits++;

    console.log(
      `| ${item.query} | ${keywordRank} | ${semanticRank} |`
    );
  }

  const keywordMRR = mean(keywordRRs);
  const semanticMRR = mean(semanticRRs);

  const keywordRecall = keywordHits / testSet.length;
  const semanticRecall = semanticHits / testSet.length;

  console.log(
    `| **Summary** | **MRR ${keywordMRR.toFixed(2)} · Recall@10 ${keywordRecall.toFixed(2)}** | **MRR ${semanticMRR.toFixed(2)} · Recall@10 ${semanticRecall.toFixed(2)}** |`
  );
}

try {
  main();
} catch (error) {
  console.error("Evaluation failed:", error.message);
  process.exitCode = 1;
}
