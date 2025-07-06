use rand::Rng;
use rgou_ai_core::{GameState, Player, AI, PIECES_PER_PLAYER};

const AI1_SEARCH_DEPTH: u8 = 3;
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

#[test]
fn test_ai_vs_ai_simulation() {
    let mut ai1_wins = 0;
    let mut ai2_wins = 0;
    for i in 0..NUM_GAMES {
        println!("Starting game {}", i + 1);
        let mut ai1 = AI::new();
        let mut ai2 = AI::new();
        let winner = play_game(&mut ai1, &mut ai2);
        if winner == Player::Player1 {
            ai1_wins += 1;
        } else {
            ai2_wins += 1;
        }
    }
    println!("AI1 wins: {}, AI2 wins: {}", ai1_wins, ai2_wins);
    assert!(ai1_wins > 0);
}
