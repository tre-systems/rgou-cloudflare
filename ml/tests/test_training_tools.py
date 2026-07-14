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
                "metadata": {"version": "test"},
                "network_config": architecture,
            }

            converter.validate(unified, converter.detect_format(unified))
            rust = converter.convert_to_rust(unified, "unified")
            restored = converter.convert_to_unified(rust, "rust")

        self.assertEqual(restored, unified)

    def test_rejects_files_without_both_weight_arrays(self):
        with self.assertRaisesRegex(ValueError, "missing"):
            convert_weights.WeightConverter.detect_format({"value_weights": []})


if __name__ == "__main__":
    unittest.main()
