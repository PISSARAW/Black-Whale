import importlib.util
from pathlib import Path
import tempfile
import unittest
import uuid

spec = importlib.util.spec_from_file_location('analytics_setup', Path(__file__).with_name('enable-analytics.py'))
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class AnalyticsSetupTest(unittest.TestCase):
    def test_preserves_existing_configuration_and_secrets_on_rerun(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / '.env.production'
            path.write_text('DOMAIN=example.com\nPOSTGRES_PASSWORD=keep-this\nUMAMI_WEBSITE_ID=\nCOMPOSE_PROFILES=other\n')
            first = setup.configure(path)
            second = setup.configure(path)
            self.assertEqual(first, second)
            self.assertEqual(first['POSTGRES_PASSWORD'], 'keep-this')
            self.assertEqual(first['COMPOSE_PROFILES'], 'analytics,other')
            self.assertEqual(str(uuid.UUID(first['UMAMI_WEBSITE_ID'])), first['UMAMI_WEBSITE_ID'])
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(path.read_text().count('UMAMI_WEBSITE_ID='), 1)


if __name__ == '__main__':
    unittest.main()
