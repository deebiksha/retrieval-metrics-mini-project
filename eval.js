```javascript
const fs = require("fs");
const path = require("path");

const testSet = fs.readFileSync(
  path.join(__dirname, "test-set.csv"),
  "utf8"
).trim().split(/\r?\n/).slice(1).map(line => {
  const [query, correctIds] = line.split(/,(.*)/s);
  return {
    query: query.replace(/^"|"$/g, ""),
    correct_post_ids: correctIds.split(";").map(Number)
  };
});

const searchResults = JSON.parse(
  fs.readFileSync(path.join(__dirname, "search-results.json"), "utf8")
);

function reciprocalRank(results, correctIds) {
  for (let i = 0; i < results.length; i++) {
    if (correctIds.includes(Number(results[i].post_id ?? results[i]))) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

function findRank(results, correctIds) {
  for (let i = 0; i < results.length; i++) {
    if (correctIds.includes(Number(results[i].post_id ?? results[i]))) {
      return i + 1;
    }
  }
  return "miss";
}

const keywordRRs = [];
const semanticRRs = [];
let keywordHits = 0;
let semanticHits = 0;

console.log("| Query | Keyword rank | Semantic rank |");
console.log("|---|---:|---:|");

for (const item of testSet) {
  const result = searchResults[item.query];

  const keyword = result.keyword;
  const semantic = result.semantic;

  const kRR = reciprocalRank(keyword, item.correct_post_ids);
  const sRR = reciprocalRank(semantic, item.correct_post_ids);

  keywordRRs.push(kRR);
  semanticRRs.push(sRR);

  if (kRR > 0) keywordHits++;
  if (sRR > 0) semanticHits++;

  console.log(
    `| ${item.query} | ${findRank(keyword, item.correct_post_ids)} | ${findRank(semantic, item.correct_post_ids)} |`
  );
}

const mean = values =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

console.log(
  `| **Summary** | **MRR ${mean(keywordRRs).toFixed(2)} · Recall@10 ${(keywordHits / testSet.length).toFixed(2)}** | **MRR ${mean(semanticRRs).toFixed(2)} · Recall@10 ${(semanticHits / testSet.length).toFixed(2)}** |`
);
```
