//! Measures how much each extra ply of Classic expectiminimax search is worth.
//!
//! Plays every configured depth against the depth-3 baseline with paired,
//! seat-swapped games on deterministic dice streams, and reports win rate,
//! mean move time, and worst single move time per depth.
//!
//! Usage:
//!   cargo run --release --example depth_ladder
//!   LADDER="1:400,2:400,4:400,5:200,6:16" cargo run --release --example depth_ladder

use rand::{rngs::StdRng, SeedableRng};
use rayon::prelude::*;
use rgou_ai_core::{dice, genetic_params::GeneticParams, GameState, Player, AI};
use std::time::Instant;

const BASELINE_DEPTH: u8 = 3;
const SEED_BASE: u64 = 20260717;
const MAX_MOVES: u32 = 200;

#[derive(Default)]
struct SideStats {
    time_ns: u128,
    decisions: u64,
    max_move_ns: u128,
}

fn play_game(
    challenger_depth: u8,
    challenger_is_player1: bool,
    seed: u64,
) -> (bool, SideStats, SideStats) {
    let mut rng = StdRng::seed_from_u64(seed);
    let mut game_state = GameState::with_genetic_params(GeneticParams::evolved());
    let mut challenger_ai = AI::new();
    let mut baseline_ai = AI::new();
    let mut challenger = SideStats::default();
    let mut baseline = SideStats::default();
    let mut moves_played = 0;

    while !game_state.is_game_over() && moves_played < MAX_MOVES {
        game_state.dice_roll = dice::roll_dice_with_rng(&mut rng);
        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let challenger_turn =
            (game_state.current_player == Player::Player1) == challenger_is_player1;
        let start = Instant::now();
        let (best_move, _) = if challenger_turn {
            challenger_ai.get_best_move(&game_state, challenger_depth)
        } else {
            baseline_ai.get_best_move(&game_state, BASELINE_DEPTH)
        };
        let elapsed = start.elapsed().as_nanos();

        let stats = if challenger_turn {
            &mut challenger
        } else {
            &mut baseline
        };
        stats.time_ns += elapsed;
        stats.decisions += 1;
        stats.max_move_ns = stats.max_move_ns.max(elapsed);

        match best_move {
            Some(move_index) if game_state.make_move(move_index).is_ok() => {}
            _ => game_state.current_player = game_state.current_player.opponent(),
        }
        moves_played += 1;
    }

    let p1_finished = game_state
        .player1_pieces
        .iter()
        .filter(|p| p.square == 20)
        .count();
    let p2_finished = game_state
        .player2_pieces
        .iter()
        .filter(|p| p.square == 20)
        .count();
    let player1_won = p1_finished >= 7 || (p2_finished < 7 && p1_finished > p2_finished);
    let challenger_won = player1_won == challenger_is_player1;

    (challenger_won, challenger, baseline)
}

fn main() {
    rayon::ThreadPoolBuilder::new()
        .stack_size(8 * 1024 * 1024)
        .build_global()
        .ok();

    let ladder = std::env::var("LADDER").unwrap_or_else(|_| "1:400,2:400,4:400,5:200,6:16".into());
    let jobs: Vec<(u8, u32)> = ladder
        .split(',')
        .map(|entry| {
            let (depth, games) = entry.split_once(':').expect("LADDER entry must be D:GAMES");
            (
                depth.trim().parse().expect("depth"),
                games.trim().parse().expect("games"),
            )
        })
        .collect();

    println!("Classic expectiminimax depth ladder vs depth-{BASELINE_DEPTH} baseline");
    println!(
        "Paired seat-swapped games, deterministic dice, evolved weights, native release build"
    );
    println!();
    println!(
        "{:>5} {:>7} {:>10} {:>14} {:>14} {:>16}",
        "depth", "games", "win rate", "ms/move", "worst move ms", "baseline ms/move"
    );

    for (depth, games) in jobs {
        assert!(games % 2 == 0, "games per depth must be even");
        let pairs = games / 2;
        let started = Instant::now();
        let results: Vec<(bool, SideStats, SideStats)> = (0..pairs)
            .into_par_iter()
            .flat_map(|pair| {
                let seed = SEED_BASE + u64::from(pair);
                [play_game(depth, true, seed), play_game(depth, false, seed)]
            })
            .collect();

        let mut wins = 0u32;
        let mut challenger = SideStats::default();
        let mut baseline = SideStats::default();
        for (won, side_challenger, side_baseline) in results {
            wins += u32::from(won);
            challenger.time_ns += side_challenger.time_ns;
            challenger.decisions += side_challenger.decisions;
            challenger.max_move_ns = challenger.max_move_ns.max(side_challenger.max_move_ns);
            baseline.time_ns += side_baseline.time_ns;
            baseline.decisions += side_baseline.decisions;
        }

        let ms = |time_ns: u128, decisions: u64| {
            if decisions == 0 {
                0.0
            } else {
                time_ns as f64 / decisions as f64 / 1e6
            }
        };
        println!(
            "{:>5} {:>7} {:>9.1}% {:>14.2} {:>14.1} {:>16.2}   ({:.0}s wall)",
            depth,
            games,
            wins as f64 * 100.0 / games as f64,
            ms(challenger.time_ns, challenger.decisions),
            challenger.max_move_ns as f64 / 1e6,
            ms(baseline.time_ns, baseline.decisions),
            started.elapsed().as_secs_f64()
        );
    }
}
