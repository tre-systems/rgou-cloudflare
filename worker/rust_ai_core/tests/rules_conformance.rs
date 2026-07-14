use rgou_ai_core::{GameState, PiecePosition, Player, BOARD_SIZE, PIECES_PER_PLAYER};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RulesFixture {
    name: String,
    current_player: Player,
    dice_roll: u8,
    player1_squares: [i8; PIECES_PER_PLAYER],
    player2_squares: [i8; PIECES_PER_PLAYER],
    valid_moves: Vec<u8>,
}

fn game_state_from_fixture(fixture: &RulesFixture) -> GameState {
    let mut state = GameState::new();
    state.current_player = fixture.current_player;
    state.dice_roll = fixture.dice_roll;
    state.player1_pieces = fixture
        .player1_squares
        .iter()
        .map(|&square| PiecePosition {
            square,
            player: Player::Player1,
        })
        .collect();
    state.player2_pieces = fixture
        .player2_squares
        .iter()
        .map(|&square| PiecePosition {
            square,
            player: Player::Player2,
        })
        .collect();

    for piece in state
        .player1_pieces
        .iter()
        .chain(state.player2_pieces.iter())
    {
        if (0..BOARD_SIZE as i8).contains(&piece.square) {
            state.board[piece.square as usize] = Some(*piece);
        }
    }

    state
}

#[test]
fn shared_rules_fixtures_match_rust_legal_moves() {
    let fixtures: Vec<RulesFixture> = serde_json::from_str(include_str!(
        "../../../test-fixtures/rules-conformance.json"
    ))
    .expect("shared rules fixtures must contain valid JSON");

    for fixture in fixtures {
        let state = game_state_from_fixture(&fixture);
        assert_eq!(
            state.get_valid_moves(),
            fixture.valid_moves,
            "rules fixture failed: {}",
            fixture.name
        );
    }
}
