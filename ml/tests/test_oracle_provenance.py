import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts/oracle_provenance.py"
SPEC = importlib.util.spec_from_file_location("oracle_provenance", SCRIPT)
assert SPEC and SPEC.loader
oracle_provenance = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(oracle_provenance)


class OracleProvenanceTests(unittest.TestCase):
    def test_expected_weight_count(self):
        self.assertEqual(
            oracle_provenance.expected_weight_count(32, [128, 128, 64], 1),
            29_057,
        )

    def test_deterministic_gzip(self):
        content = b'{"model":"oracle"}\n'
        first = oracle_provenance.deterministic_gzip(content)
        second = oracle_provenance.deterministic_gzip(content)
        self.assertEqual(first, second)
        self.assertEqual(oracle_provenance.gzip.decompress(first), content)

    def test_repository_path_rejects_escape(self):
        with self.assertRaisesRegex(ValueError, "inside the repository"):
            oracle_provenance.repository_path(Path("../model.json"))


if __name__ == "__main__":
    unittest.main()
