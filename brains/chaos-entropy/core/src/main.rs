//! Minimal CLI stub for the future fast path.
//!
//! Usage: `ceae [seed]` — prints the deterministic parameter tuple for a seed
//! (decimal or 0x-hex; defaults to 0). Rendering lands here in Phase 2 (v1);
//! until then this binary exists so the crate's public API stays honest about
//! being consumable from a process entry point.

use ceae_core::SeedSpace;

fn main() {
    let seed = std::env::args().nth(1).map(|raw| {
        parse_seed(&raw).unwrap_or_else(|| {
            eprintln!("error: '{raw}' is not a u64 seed (decimal or 0x-hex)");
            std::process::exit(2);
        })
    });
    let seed = seed.unwrap_or(0);
    let space = SeedSpace::POC_V1;
    let params = space.sample(seed);
    println!("ceae-core/0.1.0 (skeleton)");
    println!("space cardinality : {} tuples", space.cardinality());
    println!("seed              : 0x{seed:016x}");
    println!("params            : {params:?}");
}

fn parse_seed(raw: &str) -> Option<u64> {
    match raw.strip_prefix("0x").or_else(|| raw.strip_prefix("0X")) {
        Some(hex) => u64::from_str_radix(hex, 16).ok(),
        None => raw.parse().ok(),
    }
}
