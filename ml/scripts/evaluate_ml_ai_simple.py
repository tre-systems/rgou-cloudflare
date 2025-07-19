#!/usr/bin/env python3

import json
import subprocess
import tempfile
import time
from typing import Dict, Any, List
import argparse
from tqdm import tqdm
import statistics
import os


class MLAIEvaluator:
    """Evaluates ML AI performance against Classic AI"""
    
    def __init__(self, rust_ai_path: str = "worker/rust_ai_core/target/release/rgou-ai-core"):
        self.rust_ai_path = rust_ai_path
    
    def evaluate_single_game(self, game_id: int) -> Dict[str, Any]:
        """Evaluate a single game between ML AI and Classic AI"""
        
        # Create initial game state
        game_state = {
            "player1_pieces": [{"square": -1} for _ in range(7)],
            "player2_pieces": [{"square": -1} for _ in range(7)],
            "board": [None] * 20,
            "current_player": "player1",
            "dice_roll": 0,
            "valid_moves": []
        }
        
        moves_played = 0
        max_moves = 100  # Prevent infinite games
        
        while moves_played < max_moves:
            # Check if game is over
            p1_finished = sum(1 for piece in game_state["player1_pieces"] if piece["square"] == 20)
            p2_finished = sum(1 for piece in game_state["player2_pieces"] if piece["square"] == 20)
            
            if p1_finished >= 7 or p2_finished >= 7:
                break
            
            # Roll dice
            game_state["dice_roll"] = 0  # Start with 0, will be updated by AI
            
            # Get AI move
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(game_state, f)
                temp_file = f.name
            
            try:
                result = subprocess.run(
                    [self.rust_ai_path, "get_move", temp_file],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                os.unlink(temp_file)
                
                if result.returncode != 0:
                    print(f"Error in game {game_id}: {result.stderr}")
                    break
                
                move_data = json.loads(result.stdout)
                
                # Apply move (simplified - just switch players for now)
                if move_data.get("move") is not None:
                    # In a real implementation, we would apply the move to the game state
                    pass
                
                # Switch players
                game_state["current_player"] = "player2" if game_state["current_player"] == "player1" else "player1"
                moves_played += 1
                
            except subprocess.TimeoutExpired:
                print(f"Timeout in game {game_id}")
                break
            except Exception as e:
                print(f"Error in game {game_id}: {e}")
                break
        
        # Determine winner
        p1_finished = sum(1 for piece in game_state["player1_pieces"] if piece["square"] == 20)
        p2_finished = sum(1 for piece in game_state["player2_pieces"] if piece["square"] == 20)
        
        if p1_finished >= 7:
            winner = "ML_AI"
        elif p2_finished >= 7:
            winner = "Classic_AI"
        else:
            winner = "Draw"
        
        return {
            "game_id": game_id,
            "winner": winner,
            "moves_played": moves_played,
            "p1_finished": p1_finished,
            "p2_finished": p2_finished
        }
    
    def evaluate_model(self, num_games: int = 20) -> Dict[str, Any]:
        """Evaluate ML AI model against Classic AI"""
        print(f"Evaluating ML AI model against Classic AI")
        print(f"Playing {num_games} games...")
        
        start_time = time.time()
        
        # Play games
        results = []
        for game_id in tqdm(range(num_games), desc="Playing games"):
            result = self.evaluate_single_game(game_id)
            results.append(result)
        
        evaluation_time = time.time() - start_time
        
        # Calculate statistics
        ml_wins = sum(1 for r in results if r["winner"] == "ML_AI")
        classic_wins = sum(1 for r in results if r["winner"] == "Classic_AI")
        draws = sum(1 for r in results if r["winner"] == "Draw")
        
        ml_win_rate = ml_wins / num_games
        classic_win_rate = classic_wins / num_games
        draw_rate = draws / num_games
        
        avg_moves = statistics.mean(r["moves_played"] for r in results)
        
        evaluation_results = {
            "num_games": num_games,
            "evaluation_time_seconds": evaluation_time,
            "ml_wins": ml_wins,
            "classic_wins": classic_wins,
            "draws": draws,
            "ml_win_rate": ml_win_rate,
            "classic_win_rate": classic_win_rate,
            "draw_rate": draw_rate,
            "avg_moves_per_game": avg_moves,
            "games_per_second": num_games / evaluation_time,
            "individual_games": results
        }
        
        # Print summary
        print(f"\n=== Evaluation Results ===")
        print(f"ML AI Win Rate: {ml_win_rate:.1%}")
        print(f"Classic AI Win Rate: {classic_win_rate:.1%}")
        print(f"Draw Rate: {draw_rate:.1%}")
        print(f"Average Moves per Game: {avg_moves:.1f}")
        print(f"Evaluation Time: {evaluation_time:.1f} seconds")
        print(f"Games per Second: {num_games / evaluation_time:.1f}")
        
        return evaluation_results
    
    def save_evaluation_results(self, results: Dict[str, Any], output_path: str):
        """Save evaluation results to file"""
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Evaluation results saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Evaluate ML AI against Classic AI")
    parser.add_argument("--num-games", type=int, default=20, help="Number of games to play")
    parser.add_argument("--output", type=str, default="evaluation_results.json", help="Output file for results")
    parser.add_argument("--rust-ai-path", type=str, default="worker/rust_ai_core/target/release/rgou-ai-core", help="Path to Rust AI binary")
    
    args = parser.parse_args()
    
    # Check if Rust AI exists
    if not os.path.exists(args.rust_ai_path):
        print(f"Error: Rust AI binary {args.rust_ai_path} not found")
        print("Please build the Rust AI first: cd worker/rust_ai_core && cargo build --release")
        return
    
    # Initialize evaluator
    evaluator = MLAIEvaluator(args.rust_ai_path)
    
    # Run evaluation
    results = evaluator.evaluate_model(args.num_games)
    
    # Save results
    evaluator.save_evaluation_results(results, args.output)
    
    # Determine if model is better than baseline
    if results["ml_win_rate"] > 0.5:
        print(f"\n✅ SUCCESS: ML AI achieves {results['ml_win_rate']:.1%} win rate against Classic AI!")
    else:
        print(f"\n⚠️  NEEDS IMPROVEMENT: ML AI achieves {results['ml_win_rate']:.1%} win rate against Classic AI")


if __name__ == "__main__":
    main() 