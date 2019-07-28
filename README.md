WIP: Parser written with parser combinetor instead of code-generated.

# Benchmark

```
complex_msg AST length 1978
normal_msg AST length 400
simple_msg AST length 79
string_msg AST length 36
complex_msg x 2,494 ops/sec ±0.89% (89 runs sampled)
normal_msg x 10,156 ops/sec ±0.27% (96 runs sampled)
simple_msg x 53,737 ops/sec ±0.29% (95 runs sampled)
string_msg x 108,060 ops/sec ±0.60% (94 runs sampled)
```

vs. `intl-messageformat-parser`:

```
complex_msg AST length 1978
normal_msg AST length 400
simple_msg AST length 79
string_msg AST length 36
complex_msg x 4,218 ops/sec ±0.86% (90 runs sampled)
normal_msg x 29,686 ops/sec ±0.64% (90 runs sampled)
simple_msg x 129,604 ops/sec ±0.69% (94 runs sampled)
string_msg x 166,476 ops/sec ±0.82% (87 runs sampled)
```
