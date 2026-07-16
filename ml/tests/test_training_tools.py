import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

try:
    import torch
except ModuleNotFoundError:
    torch = None


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


convert_weights = load_script("convert_weights")
weight_layout = load_script("weight_layout")
train = load_script("train")
train_pytorch = load_script("train_pytorch") if torch is not None else None


class TrainingLauncherTests(unittest.TestCase):
    def test_auto_backend_falls_back_to_rust_without_a_gpu(self):
        trainer = train.UnifiedTrainer()
        trainer.check_pytorch_available = Mock(return_value=False)
        trainer.train_rust = Mock(return_value=True)

        self.assertTrue(trainer.train("auto", "quick", "test.json"))
        trainer.train_rust.assert_called_once()

    def test_rejects_non_positive_arguments(self):
        with self.assertRaisesRegex(Exception, "must be positive"):
            train.positive_int("0")

    def test_rejects_output_paths_outside_the_weights_directory(self):
        with self.assertRaisesRegex(ValueError, "weights directory"):
            train.output_path(Path("/tmp/weights"), "../outside.json")


@unittest.skipUnless(torch is not None, "PyTorch is not installed")
class PyTorchTrainingTests(unittest.TestCase):
    def test_policy_network_returns_logits_for_cross_entropy(self):
        assert train_pytorch is not None
        network = train_pytorch.PolicyNetwork(
            {
                "input_size": 2,
                "hidden_sizes": [2],
                "policy_output_size": 2,
            }
        )
        network.eval()
        final_layer = network.network[-1]
        with torch.no_grad():
            final_layer.weight.zero_()
            final_layer.bias.copy_(torch.tensor([1.0, 2.0]))

        output = network(torch.zeros((1, 2)))

        self.assertTrue(torch.equal(output, torch.tensor([[1.0, 2.0]])))

    def test_training_configuration_rejects_invalid_ranges(self):
        assert train_pytorch is not None
        with self.assertRaisesRegex(ValueError, "must be positive"):
            train_pytorch.TrainingConfig(num_games=0)


class WeightConverterTests(unittest.TestCase):
    def test_shared_fixture_matches_pytorch_and_runtime_layouts(self):
        fixture_path = Path(__file__).resolve().parents[2] / "test-fixtures/ml-weight-layout.json"
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))

        serialized = weight_layout.serialize_pytorch_linear(
            fixture["pytorch_weight_rows"], fixture["biases"]
        )

        self.assertEqual(serialized, fixture["runtime_weights"])
        self.assertEqual(fixture["weight_layout"], weight_layout.RUNTIME_WEIGHT_LAYOUT)

    def test_round_trips_unified_and_rust_formats(self):
        architecture = {
            "input_size": 2,
            "hidden_sizes": [2],
            "value_output_size": 1,
            "policy_output_size": 2,
        }
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "training.json"
            config.write_text(
                json.dumps({"network_architecture": architecture}),
                encoding="utf-8",
            )
            converter = convert_weights.WeightConverter(config)
            unified = {
                "value_weights": [0.0] * 9,
                "policy_weights": [0.0] * 12,
                "weight_layout": weight_layout.RUNTIME_WEIGHT_LAYOUT,
                "metadata": {"version": "test"},
                "network_config": architecture,
            }

            converter.validate(unified, converter.detect_format(unified))
            rust = converter.convert_to_rust(unified, "unified")
            restored = converter.convert_to_unified(rust, "rust")

        self.assertEqual(restored, unified)

    def test_converts_legacy_pytorch_matrices_to_runtime_order(self):
        architecture = {
            "input_size": 2,
            "hidden_sizes": [],
            "value_output_size": 3,
            "policy_output_size": 3,
        }
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "training.json"
            config.write_text(
                json.dumps({"network_architecture": architecture}), encoding="utf-8"
            )
            converter = convert_weights.WeightConverter(config)
            legacy = {
                "value_weights": [1, 2, 3, 4, 5, 6, 0.5, -0.5, 1],
                "policy_weights": [1, 2, 3, 4, 5, 6, 0.5, -0.5, 1],
                "metadata": {},
                "network_config": architecture,
            }

            converted = converter.convert_to_unified(
                legacy,
                "unified",
                weight_layout.PYTORCH_WEIGHT_LAYOUT,
            )

        self.assertEqual(
            converted["value_weights"],
            [1, 3, 5, 2, 4, 6, 0.5, -0.5, 1],
        )
        self.assertEqual(converted["weight_layout"], weight_layout.RUNTIME_WEIGHT_LAYOUT)

    def test_rejects_undeclared_legacy_layout(self):
        converter = convert_weights.WeightConverter()
        model = {
            "value_weights": [],
            "policy_weights": [],
            "network_config": converter.config["network_architecture"],
        }

        with self.assertRaisesRegex(ValueError, "missing weight_layout"):
            converter.convert_to_unified(model, "unified")

    def test_rejects_files_without_both_weight_arrays(self):
        with self.assertRaisesRegex(ValueError, "missing"):
            convert_weights.WeightConverter.detect_format({"value_weights": []})


if __name__ == "__main__":
    unittest.main()
