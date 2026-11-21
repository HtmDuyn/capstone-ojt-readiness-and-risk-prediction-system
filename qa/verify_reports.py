"""Validate workbook counts, current evidence, cached formulas and secret exclusion."""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
from zipfile import ZipFile
from openpyxl import load_workbook
from export_reports import GROUPS, ROOT, load_json


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--results', type=Path)
    args = parser.parse_args()
    latest = load_json(ROOT / 'qa/results/latest.json', {})
    directory = args.results or Path(latest.get('directory', ROOT / 'qa/results/manual'))
    cases = load_json(directory / 'normalized-cases.json')
    assert cases, 'Missing normalized testcases'
    ids = [c['id'] for c in cases]
    assert len(ids) == len(set(ids)), 'Duplicate IDs'
    by_id = {c['id']: c for c in cases}
    for case in cases:
        if case['status'] in ('Passed', 'Failed'):
            assert case['evidence'], f'{case["id"]} lacks execution evidence'
            for link in case['evidence'].splitlines():
                assert (ROOT / link).exists(), f'Missing evidence file: {link}'
        if case['id'].startswith('PLAN-'):
            assert case['status'] == 'Pending', 'Historical PASS leaked into current result'
    secret_values = [a['password'] for a in load_json(ROOT / 'qa/accounts.local.json', []) if a.get('password') != 'REPLACE_LOCALLY']
    reports = ROOT / 'qa/reports'
    for filename in ['OJT_RPA_Unit_Test_Current.xlsx', 'OJT_RPA_Test_Report_Current.xlsx']:
        file = reports / filename
        book = load_workbook(file, data_only=False)
        values = load_workbook(file, data_only=True)
        all_text = []
        for sheet in book:
            for row in sheet:
                for cell in row:
                    if cell.value is None:
                        continue
                    all_text.append(str(cell.value))
                    if cell.data_type == 'f':
                        assert '#REF!' not in cell.value, f'Broken formula {sheet.title}!{cell.coordinate}'
                        assert values[sheet.title][cell.coordinate].value is not None, f'Missing cached formula {cell.coordinate}'
                        for name in re.findall(r"'([^']+)'!", cell.value):
                            assert name in book.sheetnames, f'Unknown referenced sheet {name}'
        text = '\n'.join(all_text)
        for secret in secret_values:
            assert secret not in text, 'Configured password found in workbook'
        assert not re.search(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', text), 'JWT found in workbook'
        seen = []
        unit = '_Unit_Test_' in filename
        selected = [c for c in cases if not unit or c['level'] in ('Unit', 'Component', 'Manual plan (reference)')]
        for group in GROUPS:
            expected = [c for c in selected if c['group'] == group]
            counts = Counter(c['status'] for c in expected)
            sheet, cached = book[group], values[group]
            if unit:
                for col in range(5, 5 + len(expected)):
                    case_id = sheet.cell(8, col).value; seen.append(case_id)
                    assert sheet.cell(16, col).value == {'Passed': 'P', 'Failed': 'F', 'Pending': 'U', 'Blocked': 'BL'}[by_id[case_id]['status']]
                assert cached['A6'].value == counts['Passed']
                assert cached['C6'].value == counts['Failed']
                assert cached['E6'].value == len(expected) - counts['Passed'] - counts['Failed']
                assert cached['N6'].value == len(expected)
            else:
                for row in range(11, sheet.max_row + 1):
                    case_id = sheet.cell(row, 1).value
                    if case_id:
                        seen.append(case_id); assert sheet.cell(row, 6).value == by_id[case_id]['status']
                        assert not sheet.cell(row, 9).value and not sheet.cell(row, 12).value, 'Invented retest round'
                for address, status in [('B6', 'Passed'), ('C6', 'Failed'), ('D6', 'Pending'), ('F6', 'Blocked')]:
                    assert cached[address].value == counts[status]
                assert cached['B4'].value == len(expected)
        assert len(seen) == len(set(seen)), 'Duplicate workbook case ID'
        assert set(seen) == {c['id'] for c in selected}, 'Missing or extra workbook cases'
        with ZipFile(file) as archive:
            assert archive.testzip() is None, 'Workbook ZIP corruption'
        print(f'OK {filename}: {len(seen)} cases; counts/formulas/caches/evidence links/secret checks valid.')
        book.close(); values.close()
    print('All report checks passed.')


if __name__ == '__main__':
    main()
