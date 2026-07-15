"""Dependency-free parsing and reference decoding for the Finkel tablebase."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


FEATURE_SIZE = 32
PRIVATE_BIT_ORDER = (3, 2, 1, 0, 5, 4)
EXPECTED_SETTINGS = {
    "board_shape": "Standard",
    "paths": "Bell",
    "dice": "FourBinary",
    "start_pieces": 7,
    "safe_rosettes": True,
    "rosettes_grant_rolls": True,
    "captures_grant_rolls": False,
}


@dataclass(frozen=True)
class TablebaseLayout:
    entry_count: int
    keys_offset: int
    values_offset: int
    metadata: dict[str, Any]


def parse_tablebase(path: Path) -> TablebaseLayout:
    with path.open("rb") as source:
        if source.read(3) != b"RGU" or source.read(1) != b"\0":
            raise ValueError("tablebase must use RGU version 0")
        header_length = int.from_bytes(source.read(4), "big", signed=True)
        if header_length <= 0 or header_length > 16_384:
            raise ValueError("tablebase header length is invalid")
        metadata = json.loads(source.read(header_length))
        map_count = int.from_bytes(source.read(4), "big", signed=True)
        if map_count != 1:
            raise ValueError("Finkel tablebase must contain exactly one map")
        entry_count = int.from_bytes(source.read(4), "big", signed=True)
        keys_offset = source.tell()

    if metadata.get("game_settings") != EXPECTED_SETTINGS:
        raise ValueError("tablebase rules do not match the application Finkel rules")
    values_offset = keys_offset + entry_count * 4
    expected_size = values_offset + entry_count * 2
    if path.stat().st_size != expected_size:
        raise ValueError("tablebase size does not match its header")
    return TablebaseLayout(entry_count, keys_offset, values_offset, metadata)


def middle_lane_states() -> tuple[int, ...]:
    states: list[int] = []

    def visit(state: int, light_left: int, dark_left: int, index: int) -> None:
        for occupant in range(3):
            next_light = light_left - (occupant == 2)
            next_dark = dark_left - (occupant == 1)
            if next_light < 0 or next_dark < 0:
                continue
            next_state = state | (occupant << (2 * index))
            if index == 7:
                states.append(next_state)
            else:
                visit(next_state, next_light, next_dark, index + 1)

    visit(0, 7, 7, 0)
    return tuple(states)


def decode_key(key: int) -> tuple[float, ...]:
    features = [0.0] * FEATURE_SIZE
    for output, bit in enumerate(PRIVATE_BIT_ORDER):
        features[output] = float((key >> (19 + bit)) & 1)
        features[6 + output] = float((key >> bit) & 1)

    middle = middle_lane_states()[(key >> 6) & 0x1FFF]
    for square in range(8):
        occupant = (middle >> (2 * square)) & 0b11
        features[12 + square] = float(occupant == 2)
        features[20 + square] = float(occupant == 1)

    current_reserve = (key >> 28) & 0b111
    opponent_reserve = (key >> 25) & 0b111
    current_on_board = sum(features[:6]) + sum(features[12:20])
    opponent_on_board = sum(features[6:12]) + sum(features[20:28])
    current_finished = 7 - current_reserve - current_on_board
    opponent_finished = 7 - opponent_reserve - opponent_on_board
    if current_finished < 0 or opponent_finished < 0:
        raise ValueError("tablebase key contains an invalid piece count")

    features[28:] = (
        current_reserve / 7,
        opponent_reserve / 7,
        current_finished / 7,
        opponent_finished / 7,
    )
    return tuple(features)
