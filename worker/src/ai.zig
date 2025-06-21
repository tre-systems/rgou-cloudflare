const std = @import("std");
const Allocator = std.mem.Allocator;

// Game constants
const PIECES_PER_PLAYER = 7;
const BOARD_SIZE = 20;
const ROSETTE_SQUARES = [_]u8{ 4, 8, 14 };
const PLAYER1_TRACK = [_]u8{ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 };
const PLAYER2_TRACK = [_]u8{ 16, 17, 18, 19, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 };

// Game state representation
const Player = enum(u8) {
    player1 = 0,
    player2 = 1,
};

const PiecePosition = struct {
    square: i8, // -1 for start, 0-19 for board, 20 for finished
    player: Player,
};

const GameState = struct {
    board: [BOARD_SIZE]?PiecePosition,
    player1_pieces: [PIECES_PER_PLAYER]PiecePosition,
    player2_pieces: [PIECES_PER_PLAYER]PiecePosition,
    current_player: Player,
    dice_roll: u8,

    pub fn init() GameState {
        var state = GameState{
            .board = [_]?PiecePosition{null} ** BOARD_SIZE,
            .player1_pieces = undefined,
            .player2_pieces = undefined,
            .current_player = Player.player1,
            .dice_roll = 0,
        };

        // Initialize pieces at start
        for (&state.player1_pieces) |*piece| {
            piece.* = PiecePosition{ .square = -1, .player = Player.player1 };
        }
        for (&state.player2_pieces) |*piece| {
            piece.* = PiecePosition{ .square = -1, .player = Player.player2 };
        }

        return state;
    }

    pub fn clone(self: *const GameState) GameState {
        return GameState{
            .board = self.board,
            .player1_pieces = self.player1_pieces,
            .player2_pieces = self.player2_pieces,
            .current_player = self.current_player,
            .dice_roll = self.dice_roll,
        };
    }

    pub fn getPieces(self: *const GameState, player: Player) []const PiecePosition {
        return switch (player) {
            .player1 => &self.player1_pieces,
            .player2 => &self.player2_pieces,
        };
    }

    pub fn getPiecesMut(self: *GameState, player: Player) []PiecePosition {
        return switch (player) {
            .player1 => &self.player1_pieces,
            .player2 => &self.player2_pieces,
        };
    }

    pub fn getPlayerTrack(player: Player) []const u8 {
        return switch (player) {
            .player1 => &PLAYER1_TRACK,
            .player2 => &PLAYER2_TRACK,
        };
    }

    pub fn isRosette(square: u8) bool {
        for (ROSETTE_SQUARES) |rosette| {
            if (square == rosette) return true;
        }
        return false;
    }

    pub fn getValidMoves(self: *const GameState, allocator: Allocator) ![]u8 {
        if (self.dice_roll == 0) return &[_]u8{};

        var valid_moves = std.ArrayList(u8).init(allocator);
        defer valid_moves.deinit();

        const current_pieces = self.getPieces(self.current_player);
        const track = getPlayerTrack(self.current_player);

        for (current_pieces, 0..) |piece, i| {
            const current_track_pos: i8 = if (piece.square == -1) -1 else blk: {
                for (track, 0..) |square, j| {
                    if (square == piece.square) break :blk @intCast(j);
                }
                break :blk -1;
            };

            const new_track_pos = current_track_pos + @as(i8, @intCast(self.dice_roll));

            // Check if move is valid
            if (new_track_pos >= track.len) {
                // Finishing move - only valid if exact
                if (new_track_pos == track.len) {
                    try valid_moves.append(@intCast(i));
                }
            } else {
                const new_actual_pos = track[@intCast(new_track_pos)];
                const occupant = self.board[new_actual_pos];

                // Can move if square is empty, or occupied by opponent (and not on rosette)
                if (occupant == null or
                    (occupant.?.player != self.current_player and !isRosette(new_actual_pos)))
                {
                    try valid_moves.append(@intCast(i));
                }
            }
        }

        return valid_moves.toOwnedSlice();
    }

    pub fn makeMove(self: *GameState, piece_index: u8) !bool {
        const current_pieces = self.getPiecesMut(self.current_player);
        const track = getPlayerTrack(self.current_player);

        if (piece_index >= current_pieces.len) return false;

        const piece = &current_pieces[piece_index];
        const current_track_pos: i8 = if (piece.square == -1) -1 else blk: {
            for (track, 0..) |square, j| {
                if (square == piece.square) break :blk @intCast(j);
            }
            break :blk -1;
        };

        const new_track_pos = current_track_pos + @as(i8, @intCast(self.dice_roll));

        // Remove piece from old position
        if (piece.square >= 0) {
            self.board[@intCast(piece.square)] = null;
        }

        // Check if finishing
        if (new_track_pos >= track.len) {
            piece.square = 20; // Finished
        } else {
            const new_actual_pos = track[@intCast(new_track_pos)];
            const occupant = self.board[new_actual_pos];

            // If there's an opponent piece, send it back to start
            if (occupant != null and occupant.?.player != self.current_player) {
                const opponent_pieces = self.getPiecesMut(occupant.?.player);
                for (opponent_pieces) |*opp_piece| {
                    if (opp_piece.square == new_actual_pos) {
                        opp_piece.square = -1;
                        break;
                    }
                }
            }

            // Place piece in new position
            piece.square = @intCast(new_actual_pos);
            self.board[new_actual_pos] = piece.*;
        }

        // Check for win condition
        const finished_pieces = blk: {
            var count: u8 = 0;
            for (current_pieces) |p| {
                if (p.square == 20) count += 1;
            }
            break :blk count;
        };

        if (finished_pieces == PIECES_PER_PLAYER) {
            return true; // Game won
        }

        // Determine next player (stay if landed on rosette)
        const landed_on_rosette = new_track_pos < track.len and
            isRosette(track[@intCast(new_track_pos)]);

        if (!landed_on_rosette) {
            self.current_player = if (self.current_player == Player.player1) Player.player2 else Player.player1;
        }

        return false; // Game continues
    }

    // Evaluate game state for AI (positive = good for player2, negative = good for player1)
    pub fn evaluate(self: *const GameState) i32 {
        var score: i32 = 0;

        // Count finished pieces
        var p1_finished: i32 = 0;
        var p2_finished: i32 = 0;

        for (self.player1_pieces) |piece| {
            if (piece.square == 20) p1_finished += 1;
        }
        for (self.player2_pieces) |piece| {
            if (piece.square == 20) p2_finished += 1;
        }

        // Heavily weight finished pieces
        score += (p2_finished - p1_finished) * 1000;

        // Win condition
        if (p1_finished == PIECES_PER_PLAYER) return -10000;
        if (p2_finished == PIECES_PER_PLAYER) return 10000;

        // Evaluate piece positions
        var p1_position_score: i32 = 0;
        var p2_position_score: i32 = 0;

        for (self.player1_pieces) |piece| {
            if (piece.square >= 0 and piece.square < 20) {
                // Find position in track
                const track = getPlayerTrack(Player.player1);
                for (track, 0..) |square, i| {
                    if (square == piece.square) {
                        p1_position_score += @intCast(i + 1);
                        break;
                    }
                }
            }
        }

        for (self.player2_pieces) |piece| {
            if (piece.square >= 0 and piece.square < 20) {
                // Find position in track
                const track = getPlayerTrack(Player.player2);
                for (track, 0..) |square, i| {
                    if (square == piece.square) {
                        p2_position_score += @intCast(i + 1);
                        break;
                    }
                }
            }
        }

        score += (p2_position_score - p1_position_score) * 10;

        return score;
    }
};

// AI implementation using minimax with alpha-beta pruning
const AI = struct {
    const MAX_DEPTH = 6;

    pub fn getBestMove(state: *const GameState, allocator: Allocator) !u8 {
        const valid_moves = try state.getValidMoves(allocator);
        defer allocator.free(valid_moves);

        if (valid_moves.len == 0) return 0;
        if (valid_moves.len == 1) return valid_moves[0];

        var best_move = valid_moves[0];
        var best_score: i32 = std.math.minInt(i32);

        for (valid_moves) |move| {
            var test_state = state.clone();
            _ = try test_state.makeMove(move);

            // Simulate dice rolls for next turn
            var score: i32 = 0;
            var roll_count: u8 = 0;

            for (0..5) |dice_roll| {
                test_state.dice_roll = @intCast(dice_roll);
                const move_score = try minimax(&test_state, MAX_DEPTH - 1, false, std.math.minInt(i32), std.math.maxInt(i32), allocator);
                score += move_score;
                roll_count += 1;
            }

            score = @divFloor(score, roll_count);

            if (score > best_score) {
                best_score = score;
                best_move = move;
            }
        }

        return best_move;
    }

    fn minimax(state: *GameState, depth: u8, is_maximizing: bool, alpha: i32, beta: i32, allocator: Allocator) !i32 {
        if (depth == 0) return state.evaluate();

        const valid_moves = try state.getValidMoves(allocator);
        defer allocator.free(valid_moves);

        if (valid_moves.len == 0) {
            // No moves available, switch player
            state.current_player = if (state.current_player == Player.player1) Player.player2 else Player.player1;
            return state.evaluate();
        }

        var alpha_local = alpha;
        var beta_local = beta;

        if (is_maximizing) {
            var max_eval: i32 = std.math.minInt(i32);

            for (valid_moves) |move| {
                var test_state = state.clone();
                const game_won = try test_state.makeMove(move);

                if (game_won) {
                    return if (test_state.current_player == Player.player2) 10000 else -10000;
                }

                const eval_score = try minimax(&test_state, depth - 1, false, alpha_local, beta_local, allocator);
                max_eval = @max(max_eval, eval_score);
                alpha_local = @max(alpha_local, eval_score);

                if (beta_local <= alpha_local) break; // Alpha-beta pruning
            }

            return max_eval;
        } else {
            var min_eval: i32 = std.math.maxInt(i32);

            for (valid_moves) |move| {
                var test_state = state.clone();
                const game_won = try test_state.makeMove(move);

                if (game_won) {
                    return if (test_state.current_player == Player.player1) -10000 else 10000;
                }

                const eval_score = try minimax(&test_state, depth - 1, true, alpha_local, beta_local, allocator);
                min_eval = @min(min_eval, eval_score);
                beta_local = @min(beta_local, eval_score);

                if (beta_local <= alpha_local) break; // Alpha-beta pruning
            }

            return min_eval;
        }
    }
};

// Export functions for JavaScript
export fn createGameState() *GameState {
    const allocator = std.heap.page_allocator;
    const state = allocator.create(GameState) catch unreachable;
    state.* = GameState.init();
    return state;
}

export fn destroyGameState(state: *GameState) void {
    const allocator = std.heap.page_allocator;
    allocator.destroy(state);
}

export fn getAIMove(state: *const GameState) u8 {
    const allocator = std.heap.page_allocator;
    return AI.getBestMove(state, allocator) catch 0;
}

export fn evaluatePosition(state: *const GameState) i32 {
    return state.evaluate();
}
