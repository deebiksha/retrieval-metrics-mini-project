## Result

| Query | Keyword rank | Semantic rank |
|---|---:|---:|
| my redis cache keeps showing old data | 8 | 1 |
| how do I add semantic search to a table I already have | miss | 2 |
| redis or memcached for caching | 1 | 2 |
| why did my query get slower after I added an index | miss | 1 |
| what does ACID actually guarantee | 2 | 1 |
| how do I keep my postgres online while changing the schema | 6 | 3 |
| my background jobs stop after every deploy | miss | 2 |
| how do I let my database accept more writes per second | 4 | 1 |
| sql or nosql for a new product | 1 | 3 |
| why does my redis memory keep climbing | miss | 2 |
| **Summary** | **MRR 0.30 · Recall@10 0.60** | **MRR 0.67 · Recall@10 1.00** |

## Interpretation

Semantic search performs better overall than keyword search, with an MRR of 0.67 compared with 0.30 and Recall@10 of 1.00 compared with 0.60. Keyword search performs well on exact technical terms, such as “redis or memcached for caching” and “sql or nosql for a new product.” Semantic search performs better on symptom-based and paraphrased queries because it can identify relevant results even when the wording differs. It finds a correct answer for all ten queries, while keyword search misses four. A team may still keep keyword search because it can perform well on exact matches, and combining both approaches may improve search quality.