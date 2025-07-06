use criterion::{Criterion, black_box, criterion_group, criterion_main};
use rand::Rng;
use rgou_ai_core::{AI, GameState, PIECES_PER_PLAYER, Player};

const AI1_SEARCH_DEPTH: u8 = 5;
const AI2_SEARCH_DEPTH: u8 = 4;
const NUM_GAMES: usize = 10;

fn play_game(ai1: &mut AI, ai2: &mut AI) -> Player {
    let mut game_state = GameState::new();

    loop {
        let current_player = game_state.current_player;
        let current_ai = if current_player == Player::Player1 {
            &mut *ai1
        } else {
            &mut *ai2
        };

        game_state.dice_roll = rand::thread_rng().gen_range(0..=4);

        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let depth = if current_player == Player::Player1 {
            AI1_SEARCH_DEPTH
        } else {
            AI2_SEARCH_DEPTH
        };
        let (best_move, _) = current_ai.get_best_move(&game_state, depth);

        if let Some(piece_index) = best_move {
            game_state.make_move(piece_index);

            if game_state.is_game_over() {
                let p1_finished = game_state
                    .player1_pieces
                    .iter()
                    .filter(|p| p.square == 20)
                    .count();
                if p1_finished == PIECES_PER_PLAYER {
                    return Player::Player1;
                } else {
                    return Player::Player2;
                }
            }
        } else {
            game_state.current_player = game_state.current_player.opponent();
        }
    }
}

pub fn simulation_benchmark(c: &mut Criterion) {
    c.bench_function("ai_vs_ai_simulation", |b| {
        b.iter(|| {
            let mut ai1_wins = 0;
            let mut ai2_wins = 0;

            for i in 0..NUM_GAMES {
                println!("--- Starting Game {} ---", i + 1);
                let mut ai1 = AI::new();
                let mut ai2 = AI::new();

                let winner = play_game(black_box(&mut ai1), black_box(&mut ai2));
                if winner == Player::Player1 {
                    ai1_wins += 1;
                    println!("Player 1 (AI, depth {}) wins!", AI1_SEARCH_DEPTH);
                } else {
                    ai2_wins += 1;
                    println!("Player 2 (AI, depth {}) wins!", AI2_SEARCH_DEPTH);
                }
            }

            println!("\n--- Simulation Complete ---");
            println!(
                "AI1 (depth {}) wins: {}/{}",
                AI1_SEARCH_DEPTH, ai1_wins, NUM_GAMES
            );
            println!(
                "AI2 (depth {}) wins: {}/{}",
                AI2_SEARCH_DEPTH, ai2_wins, NUM_GAMES
            );
        })
    });
}

criterion_group!(benches, simulation_benchmark);
criterion_main!(benches);
