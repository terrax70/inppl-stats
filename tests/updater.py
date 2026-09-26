"""Test updates in a temporary directory without modifying the real workbook/data."""
from pathlib import Path
import importlib.util
import tempfile
import shutil
import json

root = Path(__file__).resolve().parents[1]
bundle = root / 'INPPL_AKTUALIZATOR_EXCEL_1.3.6_CACHE_SAFE'
spec = importlib.util.spec_from_file_location('updater', bundle / 'aktualizuj.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)
assert updater.ROOT == root
for label in ('Hard Lose', 'hard loss', 'LOSE', 'Przegrana', 'Odpuszczona'):
    assert updater.parse_war_result(label)[0] == 'loss', label
for label in ('Wygrana', 'Ez Win', 'Hard Win'):
    assert updater.parse_war_result(label)[0] == 'win', label
assert updater.parse_war_result('Wojna', 'Hard Lose') == ('loss', 'PRZEGRANA', 'Hard Lose')
assert updater.parse_war_result('Wojna', 'Odpuszczona')[0] == 'loss'
assert updater.parse_war_result('Wojna')[0] is None
assert updater.parse_war_result('Nieznany wynik')[0] is None
with tempfile.TemporaryDirectory() as directory:
    site = Path(directory)
    for name in ('index.html', 'app.js', 'data.js', 'data-loader.js', 'styles.css', 'ui-shell.css',
                 'share', 'planner', 'knowledge', 'charts'):
        source = root / name
        if source.is_dir():
            shutil.copytree(source, site / name)
        else:
            shutil.copy2(source, site / name)
    updater.ROOT = site
    updater.DATA = site / 'data.js'
    updater.INDEX = site / 'index.html'
    updater.KNOWLEDGE_INDEX = site / 'knowledge/index.html'
    updater.GITHUB_UPDATE_DIR = site / '_github_update'
    updater.BACKUP_DIR = site / '_backup'
    assert updater.main() == 0
    generated = json.loads(updater.DATA.read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
    assert generated['activeCount'] > 0
    assert generated['weeks']
    w13 = next(w for w in generated['weeks'] if w['week'] == 'W13')
    assert (w13['result'], w13['resultLabel'], w13['resultType']) == ('loss', 'PRZEGRANA', 'Hard Lose')
    for file in ('data-loader.js', 'app.js', 'data.js', 'share/index.html', 'planner/index.html', 'version.json'):
        assert (updater.GITHUB_UPDATE_DIR / file).exists(), file
    print('Updater: real workbook read and full export verified in temporary directory.')
