mod authority;
mod conditions;
mod engine;
mod receipt;
mod replay;
mod routes;
mod signing;

use std::env;
use std::process;

fn print_usage() {
    eprintln!("Usage: cargo run --release -- scenario <input_path> <output_dir>");
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 4 || args[1] != "scenario" {
        print_usage();
        process::exit(2);
    }

    if let Err(err) = engine::run_scenario(&args[2], &args[3]) {
        eprintln!("error: {err}");
        process::exit(1);
    }
}
