"""Shared serialization contract for ML network weights."""

from collections.abc import Sequence


RUNTIME_WEIGHT_LAYOUT = "input-output-row-major-v1"
PYTORCH_WEIGHT_LAYOUT = "output-input-row-major-v1"


def serialize_pytorch_linear(
    weight_rows: Sequence[Sequence[float]], biases: Sequence[float]
) -> list[float]:
    """Serialize a PyTorch [output, input] matrix for Rust [input, output]."""
    output_size = len(weight_rows)
    if output_size == 0 or len(biases) != output_size:
        raise ValueError("linear layer dimensions do not match")

    input_size = len(weight_rows[0])
    if input_size == 0 or any(len(row) != input_size for row in weight_rows):
        raise ValueError("linear layer weights must be a non-empty rectangle")

    serialized = [
        float(weight_rows[output_index][input_index])
        for input_index in range(input_size)
        for output_index in range(output_size)
    ]
    serialized.extend(float(bias) for bias in biases)
    return serialized


def convert_pytorch_network_weights(
    weights: Sequence[float],
    input_size: int,
    hidden_sizes: Sequence[int],
    output_size: int,
) -> list[float]:
    """Convert legacy flattened PyTorch parameters to the runtime layout."""
    converted: list[float] = []
    offset = 0
    previous_size = input_size

    for layer_size in [*hidden_sizes, output_size]:
        matrix_size = previous_size * layer_size
        matrix_end = offset + matrix_size
        bias_end = matrix_end + layer_size
        if bias_end > len(weights):
            raise ValueError("network weights end inside a linear layer")

        flat_matrix = weights[offset:matrix_end]
        rows = [
            flat_matrix[row * previous_size : (row + 1) * previous_size]
            for row in range(layer_size)
        ]
        converted.extend(serialize_pytorch_linear(rows, weights[matrix_end:bias_end]))
        offset = bias_end
        previous_size = layer_size

    if offset != len(weights):
        raise ValueError("network weights contain trailing values")
    return converted
