use rgou_ai_core::{
    features::GameFeatures, ml_ai::MLAI, GameState as MLGameState, Player as MLPlayer,
};
use rgou_ai_core::{GameState, Player};

fn convert_piece_position_to_ml(
    rust_piece: &rgou_ai_core::PiecePosition,
) -> rgou_ai_core::PiecePosition {
    rgou_ai_core::PiecePosition {
        square: rust_piece.square,
        player: match rust_piece.player {
            Player::Player1 => MLPlayer::Player1,
            Player::Player2 => MLPlayer::Player2,
        },
    }
}

fn convert_game_state_to_ml(rust_state: &GameState) -> MLGameState {
    MLGameState {
        board: rust_state
            .board
            .iter()
            .map(|opt_piece| opt_piece.as_ref().map(|p| convert_piece_position_to_ml(p)))
            .collect(),
        player1_pieces: rust_state
            .player1_pieces
            .iter()
            .map(convert_piece_position_to_ml)
            .collect(),
        player2_pieces: rust_state
            .player2_pieces
            .iter()
            .map(convert_piece_position_to_ml)
            .collect(),
        current_player: match rust_state.current_player {
            Player::Player1 => MLPlayer::Player1,
            Player::Player2 => MLPlayer::Player2,
        },
        dice_roll: rust_state.dice_roll,
        genetic_params: rust_state.genetic_params.clone(),
    }
}

fn load_ml_weights() -> Result<(Vec<f32>, Vec<f32>), Box<dyn std::error::Error>> {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let weights_path = std::path::Path::new(manifest_dir)
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("ml/data/weights/ml_ai_weights_fast.json");
    let content = std::fs::read_to_string(weights_path)?;
    let weights: serde_json::Value = serde_json::from_str(&content)?;

    let value_weights: Vec<f32> = weights["valueWeights"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_f64().unwrap() as f32)
        .collect();

    let policy_weights: Vec<f32> = weights["policyWeights"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_f64().unwrap() as f32)
        .collect();

    Ok((value_weights, policy_weights))
}

#[test]
fn test_ml_ai_diagnostic() {
    println!("=== ML AI Diagnostic Test ===");

    let (value_weights, policy_weights) = match load_ml_weights() {
        Ok(weights) => weights,
        Err(e) => {
            eprintln!("Failed to load ML weights: {}", e);
            return;
        }
    };

    println!(
        "Loaded {} value weights and {} policy weights",
        value_weights.len(),
        policy_weights.len()
    );

    let mut ml_ai = MLAI::new();
    ml_ai.load_pretrained(&value_weights, &policy_weights);

    // Test 1: Initial game state
    println!("\n--- Test 1: Initial Game State ---");
    let mut game_state = GameState::new();
    game_state.dice_roll = 2;

    let ml_state = convert_game_state_to_ml(&game_state);
    let response = ml_ai.get_best_move(&ml_state);

    println!("Valid moves: {:?}", response.diagnostics.valid_moves);
    println!("Chosen move: {:?}", response.r#move);
    println!(
        "Value network output: {:.6}",
        response.diagnostics.value_network_output
    );
    println!(
        "Policy network outputs: {:?}",
        response.diagnostics.policy_network_outputs
    );
    println!("Move evaluations:");
    for eval in &response.diagnostics.move_evaluations {
        println!(
            "  Move {}: score={:.6}, type={}",
            eval.piece_index, eval.score, eval.move_type
        );
    }

    // Test 2: Game state with pieces on board
    println!("\n--- Test 2: Game State with Pieces ---");
    game_state.player1_pieces[0].square = 4;
    game_state.board[4] = Some(game_state.player1_pieces[0]);
    game_state.player2_pieces[0].square = 6;
    game_state.board[6] = Some(game_state.player2_pieces[0]);
    game_state.dice_roll = 2;

    let ml_state = convert_game_state_to_ml(&game_state);
    let response = ml_ai.get_best_move(&ml_state);

    println!("Valid moves: {:?}", response.diagnostics.valid_moves);
    println!("Chosen move: {:?}", response.r#move);
    println!(
        "Value network output: {:.6}",
        response.diagnostics.value_network_output
    );
    println!("Move evaluations:");
    for eval in &response.diagnostics.move_evaluations {
        println!(
            "  Move {}: score={:.6}, type={}",
            eval.piece_index, eval.score, eval.move_type
        );
    }

    // Test 3: Check if neural networks are actually computing
    println!("\n--- Test 3: Neural Network Computation ---");
    let features = GameFeatures::from_game_state(&ml_state);
    println!(
        "Feature vector (first 10 values): {:?}",
        &features.features[..10]
    );

    // Use the public evaluate_position method
    let value_output = ml_ai.evaluate_position(&ml_state);
    println!("Value network output: {:.6}", value_output);

    // Test 4: Multiple calls to check consistency
    println!("\n--- Test 4: Consistency Check ---");
    for i in 0..3 {
        let response = ml_ai.get_best_move(&ml_state);
        println!(
            "Call {}: move={:?}, value={:.6}",
            i, response.r#move, response.diagnostics.value_network_output
        );
    }
}
