use criterion::{black_box, criterion_group, criterion_main, Criterion};
use rand::Rng;
use rgou_ai_core::{GameState, Player, AI, PIECES_PER_PLAYER};

const AI1_SEARCH_DEPTH: u8 = 5;
const AI2_SEARCH_DEPTH: u8 = 4;
const NUM_GAMES: usize = 20;

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

fn bench_ai_vs_ai(c: &mut Criterion) {
    c.bench_function("ai_vs_ai_simulation", |b| {
        b.iter(|| {
            let mut ai1_wins = 0;
            let mut ai2_wins = 0;
            for _ in 0..NUM_GAMES {
                let mut ai1 = AI::new();
                let mut ai2 = AI::new();
                let winner = play_game(black_box(&mut ai1), black_box(&mut ai2));
                if winner == Player::Player1 {
                    ai1_wins += 1;
                } else {
                    ai2_wins += 1;
                }
            }
            // The results are not printed here anymore, but the benchmark runs.
        })
    });
}

criterion_group!(benches, bench_ai_vs_ai);
criterion_main!(benches);
