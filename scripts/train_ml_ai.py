#!/usr/bin/env python3

import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import random
import os
import subprocess
import tempfile
from typing import List, Tuple, Dict, Any
import argparse
from tqdm import tqdm
import concurrent.futures
import multiprocessing


class GameFeatures:
    SIZE = 100

    @staticmethod
    def from_game_state(game_state: Dict[str, Any]) -> np.ndarray:
        features = np.zeros(GameFeatures.SIZE, dtype=np.float32)
        idx = 0

        for piece in game_state["player1_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 20:
                features[idx] = square / 20.0
            elif square == 20:
                features[idx] = 1.0
            else:
                features[idx] = -1.0
            idx += 1

        for piece in game_state["player2_pieces"]:
            square = piece["square"]
            if square >= 0 and square < 20:
                features[idx] = square / 20.0
            elif square == 20:
                features[idx] = 1.0
            else:
                features[idx] = -1.0
            idx += 1

        for square in game_state["board"]:
            if square is None:
                features[idx] = 0.0
            else:
                features[idx] = 1.0 if square["player"] == "player1" else -1.0
            idx += 1

        features[idx] = GameFeatures._rosette_control_score(game_state)
        idx += 1

        features[idx] = GameFeatures._pieces_on_board_count(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._pieces_on_board_count(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._finished_pieces_count(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._finished_pieces_count(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._average_position_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._average_position_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._safety_score(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._safety_score(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._center_lane_control(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._center_lane_control(game_state, "player2")
        idx += 1

        features[idx] = 1.0 if game_state["current_player"] == "player1" else -1.0
        idx += 1

        features[idx] = game_state["dice_roll"] / 4.0
        idx += 1

        features[idx] = len(game_state.get("valid_moves", [])) / 7.0
        idx += 1

        features[idx] = GameFeatures._capture_opportunities(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._capture_opportunities(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._vulnerability_to_capture(game_state, "player2")
        idx += 1

        features[idx] = GameFeatures._progress_towards_finish(game_state, "player1")
        idx += 1

        features[idx] = GameFeatures._progress_towards_finish(game_state, "player2")
        idx += 1

        return features

    @staticmethod
    def _rosette_control_score(game_state: Dict[str, Any]) -> float:
        rosette_squares = [0, 7, 13, 15, 16]
        score = 0
        for rosette in rosette_squares:
            if (
                rosette < len(game_state["board"])
                and game_state["board"][rosette] is not None
            ):
                score += (
                    1.0 if game_state["board"][rosette]["player"] == "player1" else -1.0
                )
        return score

    @staticmethod
    def _pieces_on_board_count(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if 0 <= p["square"] < 20)

    @staticmethod
    def _finished_pieces_count(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if p["square"] == 20)

    @staticmethod
    def _average_position_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        track = (
            [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            if player == "player1"
            else [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        )

        total_score = 0.0
        count = 0

        for piece in pieces:
            if 0 <= piece["square"] < 20:
                try:
                    track_pos = track.index(piece["square"])
                    total_score += track_pos
                    count += 1
                except ValueError:
                    pass

        return total_score / count if count > 0 else 0.0

    @staticmethod
    def _safety_score(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        rosette_squares = [0, 7, 13, 15, 16]
        return sum(
            1
            for p in pieces
            if 0 <= p["square"] < 20 and p["square"] in rosette_squares
        )

    @staticmethod
    def _center_lane_control(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        return sum(1 for p in pieces if 4 <= p["square"] <= 11)

    @staticmethod
    def _capture_opportunities(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        opponent = "player2" if player == "player1" else "player1"
        opponent_pieces = game_state[f"{opponent}_pieces"]
        rosette_squares = {0, 7, 13, 15, 16}
        opportunities = 0

        for piece in pieces:
            if 0 <= piece["square"] < 20:
                for opp_piece in opponent_pieces:
                    if (
                        0 <= opp_piece["square"] < 20
                        and opp_piece["square"] not in rosette_squares
                        and abs(piece["square"] - opp_piece["square"]) <= 4
                    ):
                        opportunities += 1

        return opportunities

    @staticmethod
    def _vulnerability_to_capture(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        opponent = "player2" if player == "player1" else "player1"
        opponent_pieces = game_state[f"{opponent}_pieces"]
        rosette_squares = {0, 7, 13, 15, 16}
        vulnerability = 0

        for piece in pieces:
            if 0 <= piece["square"] < 20 and piece["square"] not in rosette_squares:
                for opp_piece in opponent_pieces:
                    if (
                        0 <= opp_piece["square"] < 20
                        and abs(piece["square"] - opp_piece["square"]) <= 4
                    ):
                        vulnerability += 1

        return vulnerability

    @staticmethod
    def _progress_towards_finish(game_state: Dict[str, Any], player: str) -> float:
        pieces = game_state[f"{player}_pieces"]
        track = (
            [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            if player == "player1"
            else [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
        )

        total_progress = 0.0
        count = 0

        for piece in pieces:
            if 0 <= piece["square"] < 20:
                try:
                    track_pos = track.index(piece["square"])
                    progress = track_pos / len(track)
                    total_progress += progress
                    count += 1
                except ValueError:
                    pass

        return total_progress / count if count > 0 else 0.0


class RustAIClient:
    def __init__(
        self, rust_ai_path: str = "worker/rust_ai_core/target/release/rgou_ai_core"
    ):
        self.rust_ai_path = rust_ai_path

    def get_ai_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".json", delete=False
            ) as f:
                json.dump(game_state, f)
                temp_file = f.name
            result = subprocess.run(
                [self.rust_ai_path, "get_move", temp_file],
                capture_output=True,
                text=True,
                timeout=5,
            )
            os.unlink(temp_file)
            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                return None
        except Exception as e:
            return None

    def evaluate_position(self, game_state: Dict[str, Any]) -> float:
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".json", delete=False
            ) as f:
                json.dump(game_state, f)
                temp_file = f.name
            result = subprocess.run(
                [self.rust_ai_path, "evaluate", temp_file],
                capture_output=True,
                text=True,
                timeout=5,
            )
            os.unlink(temp_file)
            if result.returncode == 0:
                return float(result.stdout.strip())
            else:
                return 0.0
        except Exception as e:
            return 0.0


PLAYER1_TRACK = [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
PLAYER2_TRACK = [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]
TRACK_LENGTH = 14
PIECES_PER_PLAYER = 7


class GameSimulator:
    def __init__(self, rust_ai_client: RustAIClient):
        self.rust_ai = rust_ai_client

    def _get_player_track(self, player: str):
        return PLAYER1_TRACK if player == "player1" else PLAYER2_TRACK

    def _is_square_occupied(
        self, square: int, player: str, game_state: Dict[str, Any]
    ) -> bool:
        occupant = game_state["board"][square]
        return occupant is not None and occupant["player"] == player

    def _all_pieces(self, game_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        return game_state["player1_pieces"] + game_state["player2_pieces"]

    def _get_valid_moves(
        self,
        pieces: List[Dict[str, Any]],
        dice_roll: int,
        player: str,
        game_state: Dict[str, Any],
    ) -> List[int]:
        track = self._get_player_track(player)
        opponent = "player2" if player == "player1" else "player1"
        rosettes = {0, 7, 13, 15, 16}
        valid_moves = []
        for i, piece in enumerate(pieces):
            if piece["square"] == -1 and dice_roll > 0:
                entry_square = track[0]
                occupant = game_state["board"][entry_square]
                if occupant is None or (
                    occupant["player"] == opponent and entry_square not in rosettes
                ):
                    valid_moves.append(i)
            elif 0 <= piece["square"] < 20:
                try:
                    pos_on_track = track.index(piece["square"])
                    new_pos = pos_on_track + dice_roll
                    if new_pos == len(track):
                        valid_moves.append(i)
                    elif new_pos < len(track):
                        dest_square = track[new_pos]
                        occupant = game_state["board"][dest_square]
                        if occupant is None or (
                            occupant["player"] == opponent
                            and dest_square not in rosettes
                        ):
                            valid_moves.append(i)
                except ValueError:
                    piece_square = piece["square"]
                    if piece_square + dice_roll <= 20:
                        occupant = game_state["board"][piece_square + dice_roll]
                        if occupant is None or (
                            occupant["player"] == opponent
                            and (piece_square + dice_roll) not in rosettes
                        ):
                            valid_moves.append(i)
        return valid_moves

    def _make_move(self, game_state: Dict[str, Any], piece_index: int):
        player = game_state["current_player"]
        pieces = (
            game_state["player1_pieces"]
            if player == "player1"
            else game_state["player2_pieces"]
        )
        opponent = "player2" if player == "player1" else "player1"
        opponent_pieces = (
            game_state["player2_pieces"]
            if player == "player1"
            else game_state["player1_pieces"]
        )
        dice_roll = game_state["dice_roll"]
        track = self._get_player_track(player)
        rosettes = {0, 7, 13, 15, 16}
        piece = pieces[piece_index]
        old_square = piece["square"]
        if piece["square"] == -1:
            new_square = track[0]
        else:
            pos_on_track = track.index(piece["square"])
            new_pos = pos_on_track + dice_roll
            if new_pos == len(track):
                new_square = 20
            else:
                new_square = track[new_pos]
        if old_square >= 0 and old_square < 20:
            game_state["board"][old_square] = None
        if new_square == 20:
            piece["square"] = 20
        else:
            occupant = game_state["board"][new_square]
            if (
                occupant is not None
                and occupant["player"] == opponent
                and new_square not in rosettes
            ):
                for op in opponent_pieces:
                    if op["square"] == new_square:
                        op["square"] = -1
                        break
            game_state["board"][new_square] = piece
            piece["square"] = new_square
        game_state["current_player"] = opponent
        game_state["dice_roll"] = random.randint(0, 4)
        next_pieces = (
            game_state["player1_pieces"]
            if game_state["current_player"] == "player1"
            else game_state["player2_pieces"]
        )
        game_state["valid_moves"] = self._get_valid_moves(
            next_pieces,
            game_state["dice_roll"],
            game_state["current_player"],
            game_state,
        )

    def _is_game_over(self, game_state: Dict[str, Any]) -> bool:
        player1_finished = sum(
            1 for p in game_state["player1_pieces"] if p["square"] == 20
        )
        player2_finished = sum(
            1 for p in game_state["player2_pieces"] if p["square"] == 20
        )
        return (
            player1_finished == PIECES_PER_PLAYER
            or player2_finished == PIECES_PER_PLAYER
        )

    def _create_initial_state(self) -> Dict[str, Any]:
        board = [None] * 21
        player1_pieces = [
            {"square": -1, "player": "player1"} for _ in range(PIECES_PER_PLAYER)
        ]
        player2_pieces = [
            {"square": -1, "player": "player2"} for _ in range(PIECES_PER_PLAYER)
        ]
        current_player = "player1"
        dice_roll = random.randint(0, 4)
        valid_moves = self._get_valid_moves(
            player1_pieces,
            dice_roll,
            current_player,
            {
                "board": board,
                "player1_pieces": player1_pieces,
                "player2_pieces": player2_pieces,
            },
        )
        return {
            "board": board,
            "player1_pieces": player1_pieces,
            "player2_pieces": player2_pieces,
            "current_player": current_player,
            "dice_roll": dice_roll,
            "valid_moves": valid_moves,
        }

    def simulate_game(self) -> Dict[str, Any]:
        game_state = self._create_initial_state()
        training_examples = []
        step = 0
        reason = None
        seen_states = {}
        while not self._is_game_over(game_state):
            if step % 100 == 0:
                p1_positions = [p["square"] for p in game_state["player1_pieces"]]
                p2_positions = [p["square"] for p in game_state["player2_pieces"]]
                print(
                    f"Step {step}: P1={p1_positions}, P2={p2_positions}, dice={game_state['dice_roll']}, valid_moves={game_state['valid_moves']}, player={game_state['current_player']}"
                )
            state_tuple = (
                tuple([p["square"] for p in game_state["player1_pieces"]]),
                tuple([p["square"] for p in game_state["player2_pieces"]]),
                game_state["current_player"],
                game_state["dice_roll"],
            )
            seen_states[state_tuple] = seen_states.get(state_tuple, 0) + 1
            if seen_states[state_tuple] >= 10:
                reason = "repeat_state"
                print(f"Breaking due to repeated state at step {step}")
                break
            features = GameFeatures.from_game_state(game_state)
            expert_evaluation = self.rust_ai.evaluate_position(game_state)
            if game_state["valid_moves"]:
                expert_move = self.rust_ai.get_ai_move(game_state)
                move = expert_move.get("move") if expert_move else None
                if move in game_state["valid_moves"]:
                    self._make_move(game_state, move)
                    training_examples.append(
                        {
                            "features": features,
                            "target_value": expert_evaluation,
                            "target_policy": self._create_target_policy(
                                game_state, move
                            ),
                        }
                    )
                else:
                    game_state["current_player"] = (
                        "player2"
                        if game_state["current_player"] == "player1"
                        else "player1"
                    )
                    game_state["dice_roll"] = random.randint(0, 4)
                    next_pieces = (
                        game_state["player1_pieces"]
                        if game_state["current_player"] == "player1"
                        else game_state["player2_pieces"]
                    )
                    game_state["valid_moves"] = self._get_valid_moves(
                        next_pieces,
                        game_state["dice_roll"],
                        game_state["current_player"],
                        game_state,
                    )
            else:
                game_state["current_player"] = (
                    "player2"
                    if game_state["current_player"] == "player1"
                    else "player1"
                )
                game_state["dice_roll"] = random.randint(0, 4)
                next_pieces = (
                    game_state["player1_pieces"]
                    if game_state["current_player"] == "player1"
                    else game_state["player2_pieces"]
                )
                game_state["valid_moves"] = self._get_valid_moves(
                    next_pieces,
                    game_state["dice_roll"],
                    game_state["current_player"],
                    game_state,
                )
            step += 1
            if step > 1000:
                reason = "step_limit"
                break
        if reason is None:
            reason = "game_over"
        finished_p1 = sum(1 for p in game_state["player1_pieces"] if p["square"] == 20)
        finished_p2 = sum(1 for p in game_state["player2_pieces"] if p["square"] == 20)
        return {
            "examples": training_examples,
            "steps": step,
            "reason": reason,
            "finished_p1": finished_p1,
            "finished_p2": finished_p2,
        }

    def _create_target_policy(
        self, game_state: Dict[str, Any], expert_move: int
    ) -> List[float]:
        policy = [0.0] * 7
        if expert_move is not None and 0 <= expert_move < 7:
            policy[expert_move] = 1.0
        return policy


class ValueNetwork(nn.Module):
    def __init__(self, input_size: int = 100):
        super(ValueNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Tanh(),
        )

    def forward(self, x):
        return self.layers(x)


class PolicyNetwork(nn.Module):
    def __init__(self, input_size: int = 100, output_size: int = 7):
        super(PolicyNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_size),
            nn.Softmax(dim=1),
        )

    def forward(self, x):
        return self.layers(x)


class GameDataset(Dataset):
    def __init__(self, training_data: List[Dict[str, Any]]):
        self.data = training_data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        example = self.data[idx]
        features = torch.tensor(example["features"], dtype=torch.float32)
        target_value = torch.tensor([example["target_value"]], dtype=torch.float32)
        target_policy = torch.tensor(example["target_policy"], dtype=torch.float32)
        return features, target_value, target_policy


def simulate_game_worker(args):
    rust_ai_path = args["rust_ai_path"]
    sim = GameSimulator(RustAIClient(rust_ai_path=rust_ai_path))
    return sim.simulate_game()


def simulate_games_parallel(num_games, rust_ai_path):
    print(f"Starting parallel simulation with {multiprocessing.cpu_count()} workers...")
    with concurrent.futures.ProcessPoolExecutor(
        max_workers=multiprocessing.cpu_count()
    ) as executor:
        futures = []
        for i in range(num_games):
            future = executor.submit(
                simulate_game_worker, {"rust_ai_path": rust_ai_path}
            )
            futures.append(future)

        results = []
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            try:
                result = future.result()
                results.append(result)
                print(f"Completed game {len(results)}/{num_games}")
            except Exception as e:
                print(f"Game {i + 1} failed: {e}")
                results.append(
                    {
                        "examples": [],
                        "steps": 0,
                        "reason": "error",
                        "finished_p1": 0,
                        "finished_p2": 0,
                    }
                )

    return results


def generate_training_data(
    num_games: int = 1000, use_rust_ai: bool = True
) -> List[Dict[str, Any]]:
    if use_rust_ai:
        rust_ai_path = "worker/rust_ai_core/target/release/rgou_ai_core"
        print(f"Using Rust AI at: {rust_ai_path}")

        if num_games == 1:
            print("Running single game test...")
            sim = GameSimulator(RustAIClient(rust_ai_path=rust_ai_path))
            game_result = sim.simulate_game()
            print(
                f"Game 1: {game_result['steps']} moves, P1={game_result['finished_p1']}/7, P2={game_result['finished_p2']}/7, reason={game_result['reason']}"
            )
            return game_result["examples"]

        results = simulate_games_parallel(num_games, rust_ai_path)
        training_data = []
        for i, game_result in enumerate(results):
            print(
                f"Game {i + 1}: {game_result['steps']} moves, P1={game_result['finished_p1']}/7, P2={game_result['finished_p2']}/7, reason={game_result['reason']}"
            )
            training_data.extend(game_result["examples"])
        print(
            f"Generated {len(training_data)} training examples from {num_games} games."
        )
        return training_data
    else:
        training_data = []
        for _ in range(num_games):
            game_state = {
                "board": [None] * 21,
                "player1_pieces": [
                    {"square": -1, "player": "player1"} for _ in range(7)
                ],
                "player2_pieces": [
                    {"square": -1, "player": "player2"} for _ in range(7)
                ],
                "current_player": "player1",
                "dice_roll": random.randint(0, 4),
            }

            for _ in range(50):
                if game_state["current_player"] == "player1":
                    piece_idx = random.randint(0, 6)
                    square = random.randint(0, 19)
                    game_state["player1_pieces"][piece_idx]["square"] = square
                    game_state["board"][square] = {"player": "player1"}
                else:
                    piece_idx = random.randint(0, 6)
                    square = random.randint(0, 19)
                    game_state["player2_pieces"][piece_idx]["square"] = square
                    game_state["board"][square] = {"player": "player2"}

            features = GameFeatures.from_game_state(game_state)

            target_value = random.uniform(-1.0, 1.0)
            target_policy = [random.random() for _ in range(7)]
            policy_sum = sum(target_policy)
            target_policy = [p / policy_sum for p in target_policy]

            training_data.append(
                {
                    "features": features.tolist(),
                    "target_value": target_value,
                    "target_policy": target_policy,
                }
            )

        print(f"Generated {len(training_data)} training examples")
        return training_data


def train_networks(
    training_data: List[Dict[str, Any]],
    epochs: int = 100,
    batch_size: int = 32,
    learning_rate: float = 0.001,
) -> Tuple[ValueNetwork, PolicyNetwork]:
    dataset = GameDataset(training_data)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    value_network = ValueNetwork()
    policy_network = PolicyNetwork()

    value_criterion = nn.MSELoss()
    policy_criterion = nn.CrossEntropyLoss()

    value_optimizer = optim.Adam(value_network.parameters(), lr=learning_rate)
    policy_optimizer = optim.Adam(policy_network.parameters(), lr=learning_rate)

    for epoch in range(epochs):
        value_loss_total = 0.0
        policy_loss_total = 0.0

        for features, target_values, target_policies in dataloader:
            value_optimizer.zero_grad()
            value_outputs = value_network(features)
            value_loss = value_criterion(value_outputs, target_values)
            value_loss.backward()
            value_optimizer.step()
            value_loss_total += value_loss.item()

            policy_optimizer.zero_grad()
            policy_outputs = policy_network(features)
            policy_loss = policy_criterion(policy_outputs, target_policies)
            policy_loss.backward()
            policy_optimizer.step()
            policy_loss_total += policy_loss.item()

        if epoch % 10 == 0:
            avg_value_loss = value_loss_total / len(dataloader)
            avg_policy_loss = policy_loss_total / len(dataloader)
            print(
                f"Epoch {epoch}: Value Loss = {avg_value_loss:.4f}, Policy Loss = {avg_policy_loss:.4f}"
            )

    return value_network, policy_network


def extract_weights(network: nn.Module) -> List[float]:
    weights = []
    for param in network.parameters():
        weights.extend(param.data.flatten().tolist())
    return weights


def save_weights(
    value_network: ValueNetwork, policy_network: PolicyNetwork, filename: str
):
    value_weights = extract_weights(value_network)
    policy_weights = extract_weights(policy_network)

    weights_data = {
        "value_weights": value_weights,
        "policy_weights": policy_weights,
        "value_network_config": {
            "input_size": 100,
            "hidden_sizes": [64, 32],
            "output_size": 1,
        },
        "policy_network_config": {
            "input_size": 100,
            "hidden_sizes": [64, 32],
            "output_size": 7,
        },
    }

    with open(filename, "w") as f:
        json.dump(weights_data, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Train ML AI for Royal Game of Ur")
    parser.add_argument(
        "--num-games", type=int, default=1000, help="Number of training games"
    )
    parser.add_argument(
        "--epochs", type=int, default=100, help="Number of training epochs"
    )
    parser.add_argument(
        "--batch-size", type=int, default=32, help="Batch size for training"
    )
    parser.add_argument(
        "--learning-rate", type=float, default=0.001, help="Learning rate"
    )
    parser.add_argument(
        "--output", type=str, default="ml_ai_weights.json", help="Output weights file"
    )
    parser.add_argument(
        "--use-rust-ai",
        action="store_true",
        help="Use Rust AI for training data generation",
    )
    parser.add_argument(
        "--synthetic", action="store_true", help="Use synthetic data instead of Rust AI"
    )

    args = parser.parse_args()

    print("==============================")
    print("Royal Game of Ur ML AI Trainer")
    print("==============================")
    print(f"Games to generate: {args.num_games}")
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch_size}")
    print(f"Learning rate: {args.learning_rate}")
    print(f"Output file: {args.output}")
    print(
        f"Data source: {'Rust AI' if args.use_rust_ai and not args.synthetic else 'Synthetic'}"
    )
    print("------------------------------")

    print("Generating training data...")
    training_data = generate_training_data(
        args.num_games, use_rust_ai=args.use_rust_ai and not args.synthetic
    )
    print(f"Generated {len(training_data)} training examples")

    print("Training networks...")
    value_network, policy_network = train_networks(
        training_data,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
    )

    print("Saving weights...")
    save_weights(value_network, policy_network, args.output)

    print("==============================")
    print("Training complete!")
    print(f"Weights saved to: {args.output}")
    print("==============================")


if __name__ == "__main__":
    main()
