import gzip
import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "model_provenance.py"
SPEC = importlib.util.spec_from_file_location("model_provenance", SCRIPT)
assert SPEC and SPEC.loader
model_provenance = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = model_provenance
SPEC.loader.exec_module(model_provenance)


class ModelProvenanceTests(unittest.TestCase):
    def test_normalizes_flat_and_dual_network_architectures(self):
        flat = {
            "input_size": 150,
            "hidden_sizes": [256, 128, 64, 32],
            "value_output_size": 1,
            "policy_output_size": 7,
        }
        dual = {
            "value_network": {
                "input_size": 150,
                "hidden_sizes": [256, 128, 64, 32],
                "output_size": 1,
            },
            "policy_network": {
                "input_size": 150,
                "hidden_sizes": [256, 128, 64, 32],
                "output_size": 7,
            },
        }

        self.assertEqual(model_provenance.normalize_architecture(dual), flat)
        self.assertEqual(model_provenance.normalize_architecture(flat), flat)

    def test_calculates_exact_production_weight_counts(self):
        hidden_sizes = [256, 128, 64, 32]
        self.assertEqual(
            model_provenance.expected_weight_count(150, hidden_sizes, 1), 81_921
        )
        self.assertEqual(
            model_provenance.expected_weight_count(150, hidden_sizes, 7), 82_119
        )

    def test_rejects_wrong_weight_count(self):
        with self.assertRaisesRegex(ValueError, "expected 2"):
            model_provenance.validate_weights("value", [0.0], 2)

    def test_prefers_recorded_training_source_revision(self):
        revision = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=model_provenance.REPOSITORY_ROOT,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

        source = model_provenance.model_revision(
            model_provenance.DEFAULT_MODEL, {"source_revision": revision}
        )

        self.assertEqual(source["kind"], "training_source_commit")
        self.assertEqual(source["revision"], revision)

    def test_gzip_output_is_deterministic_and_reversible(self):
        content = b'{"model":"fixture"}\n'

        first = model_provenance.deterministic_gzip(content)
        second = model_provenance.deterministic_gzip(content)

        self.assertEqual(first, second)
        self.assertEqual(gzip.decompress(first), content)


if __name__ == "__main__":
    unittest.main()
