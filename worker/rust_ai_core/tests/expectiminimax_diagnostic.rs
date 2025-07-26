use rgou_ai_core::{dice, genetic_params::GeneticParams, GameState, AI};
use std::time::Instant;

fn get_evolved_params() -> GeneticParams {
    GeneticParams::load_from_file("ml/data/genetic_params/evolved.json")
        .unwrap_or_else(|_| GeneticParams::default())
}

#[test]
fn test_expectiminimax_diagnostic() {
    println!("🔍 Expectiminimax Diagnostic Test");
    println!("{}", "=".repeat(50));

    let evolved_params = get_evolved_params();
    println!("Using evolved parameters: {:?}", evolved_params);

    let mut game_state = GameState::with_genetic_params(evolved_params);
    let mut ai = AI::new();
    let mut total_nodes = 0;
    let mut total_time = 0;
    let mut moves_analyzed = 0;

    println!("Starting diagnostic game...");
    println!("{}", "-".repeat(30));

    while !game_state.is_game_over() && moves_analyzed < 50 {
        game_state.dice_roll = dice::roll_dice();

        if game_state.dice_roll == 0 {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let valid_moves = game_state.get_valid_moves();
        if valid_moves.is_empty() {
            game_state.current_player = game_state.current_player.opponent();
            continue;
        }

        let start_time = Instant::now();
        let (best_move, move_evaluations) = ai.get_best_move(&game_state, 3);
        let end_time = Instant::now();

        let move_time = end_time.duration_since(start_time).as_millis();
        total_time += move_time;
        total_nodes += ai.nodes_evaluated as u64;
        moves_analyzed += 1;

        println!(
            "Move {}: Player {:?}, Dice: {}, Valid moves: {:?}",
            moves_analyzed, game_state.current_player, game_state.dice_roll, valid_moves
        );

        println!(
            "  Best move: {:?}, Nodes: {}, Time: {}ms, Cache hits: {}",
            best_move, ai.nodes_evaluated, move_time, ai.transposition_hits
        );

        if let Some(move_piece) = best_move {
            if let Err(e) = game_state.make_move(move_piece) {
                println!("  Error making move: {}", e);
                break;
            }
        } else {
            println!("  No valid move found");
            game_state.current_player = game_state.current_player.opponent();
        }

        for eval in &move_evaluations[..move_evaluations.len().min(3)] {
            println!(
                "    Move {}: Score {:.2}, Type: {}",
                eval.piece_index, eval.score, eval.move_type
            );
        }

        println!();
    }

    println!("{}", "=".repeat(50));
    println!("Diagnostic Results:");
    println!("  Total moves analyzed: {}", moves_analyzed);
    println!("  Total nodes evaluated: {}", total_nodes);
    println!("  Total time: {}ms", total_time);
    println!(
        "  Average nodes per move: {:.1}",
        total_nodes as f64 / moves_analyzed as f64
    );
    println!(
        "  Average time per move: {:.1}ms",
        total_time as f64 / moves_analyzed as f64
    );
    println!(
        "  Nodes per second: {:.0}",
        (total_nodes as f64 / total_time as f64) * 1000.0
    );

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

    println!(
        "  Final state: P1 finished: {}, P2 finished: {}",
        p1_finished, p2_finished
    );
    println!(
        "  Game status: {:?}",
        if game_state.is_game_over() {
            "Finished"
        } else {
            "In Progress"
        }
    );

    assert!(moves_analyzed > 0, "Should have analyzed at least one move");
    assert!(total_nodes > 0, "Should have evaluated at least one node");
    assert!(total_time > 0, "Should have taken some time to compute");
}
