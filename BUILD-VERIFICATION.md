# Build verification — Diri. Playroom Date v0.16.0

## Scoring rule
- Exact normalized phrase only = 2 points (`correct`).
- At least one meaningful keyword overlap but phrase differs = 1 point (`close`).
- No meaningful keyword overlap = 0 points (`miss`).
- Normalization ignores case, punctuation, and repeated whitespace; word order and extra/missing words remain significant for exact matching.

## Regression examples
- `mie ayam` vs `MIE AYAM!` => correct / 2.
- `mie ayam` vs `mie ayam goreng` => close / 1.
- `mie ayam` vs `mie ayam rebus` => close / 1.
- `mie ayam` vs `mie ayam bakar` => close / 1.
- `mie ayam` vs `mie` => close / 1.
- `mie ayam` vs `ayam mie` => close / 1.
- `mie ayam` vs `bakso` => miss / 0.

Run `npm test` to execute all automated tests. Live two-device Firebase behavior still requires deployment testing.


Automated test result: all tests must pass after running `npm test`.
