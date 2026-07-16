import gzip
import importlib.util
import os
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
SCRIPT = SCRIPTS / "model_provenance.py"
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

    def test_requires_the_runtime_weight_layout(self):
        self.assertEqual(
            model_provenance.RUNTIME_WEIGHT_LAYOUT,
            "input-output-row-major-v1",
        )

    def test_uses_recorded_training_source_commit(self):
        revision = "a" * 40
        committed_at = "2025-07-20T22:01:01+01:00"
        source = model_provenance.model_revision(
            {
                "source_revision": revision,
                "source_committed_at": committed_at,
            }
        )

        self.assertEqual(source["kind"], "training_source_commit")
        self.assertEqual(source["revision"], revision)
        self.assertEqual(source["committed_at"], committed_at)

    def test_gzip_output_is_deterministic_and_reversible(self):
        content = b'{"model":"fixture"}\n'

        first = model_provenance.deterministic_gzip(content)
        second = model_provenance.deterministic_gzip(content)

        self.assertEqual(first, second)
        self.assertEqual(gzip.decompress(first), content)

    def test_rejects_paths_outside_the_repository(self):
        with self.assertRaisesRegex(ValueError, "inside the repository"):
            model_provenance.repository_path(Path("../outside.json"))
        with self.assertRaisesRegex(ValueError, "inside the repository"):
            model_provenance.repository_path(Path("/tmp/outside.json"))

    @unittest.skipUnless(hasattr(os, "symlink"), "symlinks are unavailable")
    def test_rejects_symlinks_outside_the_repository(self):
        with tempfile.TemporaryDirectory(
            dir=model_provenance.REPOSITORY_ROOT
        ) as directory:
            link = Path(directory) / "outside"
            link.symlink_to(Path(tempfile.gettempdir()), target_is_directory=True)
            relative_link = link.relative_to(model_provenance.REPOSITORY_ROOT)

            with self.assertRaisesRegex(ValueError, "inside the repository"):
                model_provenance.repository_path(relative_link / "outside.json")


if __name__ == "__main__":
    unittest.main()
