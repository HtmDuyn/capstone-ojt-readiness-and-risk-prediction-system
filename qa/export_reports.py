"""Export the two supplied Excel layouts using current, traceable test evidence."""
from __future__ import annotations

import argparse
import base64
from collections import Counter
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import re
from copy import copy
import xml.etree.ElementTree as ET
from zipfile import ZipFile, ZIP_DEFLATED

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.properties import CalcProperties

ROOT = Path(__file__).resolve().parents[1]
GROUPS = [
    'Authentication', 'Academic & Curriculum', 'Student Data & Imports', 'OJT Eligibility',
    'AI Risk & Advising', 'Enterprise & Recruitment', 'Placement & Tasks', 'Evaluation & Reporting',
]
PROJECT = 'AI-Integrated OJT Management System for Internship Delay Risk Prediction and Pathway Advising'
VIETNAM = timezone(timedelta(hours=7))
NAVY, ORANGE, PALE = '17365D', 'ED7D31', 'EAF0F7'
COLORS = {'Passed': 'E2F0D9', 'Failed': 'FCE4D6', 'Pending': 'FFF2CC', 'Blocked': 'E4DFEC'}
THIN = Side(style='thin', color='B4C6E7')
FORMULAS: dict[str, dict[str, dict[str, float | int]]] = {}


def load_json(path, default=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else default


def relative(path):
    try:
        return str(Path(path).resolve().relative_to(ROOT)).replace('\\', '/')
    except ValueError:
        return str(path).replace('\\', '/')


def clean(value):
    text = str(value or '')
    text = re.sub(r'\x1b\[[0-9;]*m', '', text)
    # Never copy bearer values, JWTs, database URLs, or configured passwords to reports.
    text = re.sub(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[JWT REDACTED]', text)
    text = re.sub(r'postgres(?:ql)?://[^\s\'\"]+', '[DB URL REDACTED]', text)
    for account in load_json(ROOT / 'qa/accounts.local.json', []):
        secret = account.get('password', '')
        if secret and secret != 'REPLACE_LOCALLY':
            text = text.replace(secret, '[PASSWORD REDACTED]')
    return text[:16000]


def find_id(title):
    match = re.search(r'\[([A-Z0-9-]+)\]', title)
    return match.group(1) if match else None


def parse_results(directory):
    results = {}
    for file in ['backend-unit.json', 'frontend-unit.json', 'live-api.json']:
        data = load_json(directory / file, {})
        for suite in data.get('testResults', []):
            for assertion in suite.get('assertionResults', []):
                case_id = find_id(assertion.get('fullName', assertion.get('title', '')))
                if not case_id:
                    raise ValueError(f'Unmapped executed test in {file}: {assertion.get("title")}')
                state = {'passed': 'Passed', 'failed': 'Failed', 'skipped': 'Blocked', 'pending': 'Blocked', 'todo': 'Pending'}.get(assertion['status'], 'Blocked')
                message = clean('\n'.join(assertion.get('failureMessages', [])))
                results[case_id] = dict(status=state, durationMs=assertion.get('duration', 0),
                    actual=message or ('Các assertion đã đạt.' if state == 'Passed' else 'Chưa thực thi đủ do điều kiện tiên quyết/skip; xem log của lần chạy.'),
                    evidence=relative(directory / file), executedFile=relative(suite.get('name', '')))
    browser = load_json(directory / 'browser.json', {})

    def suites(items):
        for suite in items:
            for spec in suite.get('specs', []):
                case_id = find_id(spec['title'])
                if not case_id:
                    raise ValueError(f'Unmapped browser test: {spec["title"]}')
                executions = [run for test in spec.get('tests', []) for run in test.get('results', [])]
                if not executions:
                    continue
                run = executions[-1]
                message = clean('\n'.join(e.get('message', '') for e in run.get('errors', [])))
                state = {'passed': 'Passed', 'failed': 'Failed', 'timedOut': 'Failed', 'skipped': 'Blocked', 'interrupted': 'Blocked'}.get(run['status'], 'Blocked')
                if "Executable doesn't exist" in message or 'browserType.launch' in message:
                    state = 'Blocked'
                annotations = [a.get('description', '') for item in spec.get('tests', []) for a in item.get('annotations', []) if a.get('type') == 'skip']
                if state == 'Blocked' and annotations:
                    message = clean('; '.join(annotations))
                attachments = [relative(a['path']) for a in run.get('attachments', []) if a.get('path')]
                navigation = ''
                for attachment in run.get('attachments', []):
                    if attachment.get('name') != 'navigation-evidence':
                        continue
                    if attachment.get('path') and Path(attachment['path']).exists():
                        navigation = clean(Path(attachment['path']).read_text(encoding='utf-8'))
                    elif attachment.get('body'):
                        try:
                            navigation = clean(base64.b64decode(attachment['body']).decode('utf-8'))
                        except (ValueError, UnicodeDecodeError):
                            pass
                results[case_id] = dict(status=state, durationMs=run.get('duration', 0),
                    actual=(message or ('Đã đạt các checkpoint trình duyệt được mô tả.' if state == 'Passed' else 'Browser test chưa thực thi đủ.')) + ('\nNavigation: ' + navigation if navigation else ''),
                    evidence='\n'.join([relative(directory / 'browser.json'), *attachments]), executedFile=relative(ROOT / 'frontend/tests/e2e/roles.spec.ts'))
            suites(suite.get('suites', []))
    suites(browser.get('suites', []))
    return results


def planned_cases(template):
    """Extract scenario text only; historical sample statuses never become current results."""
    if not template.exists():
        raise FileNotFoundError(f'Missing supplied template: {template}. Copy the user-provided Excel templates to qa/templates first.')
    book = load_workbook(template, data_only=False)
    cases = []
    for group in GROUPS:
        sheet = book[group]
        for row in sheet.iter_rows(min_row=11, max_row=sheet.max_row, max_col=15):
            original_id = str(row[0].value or '')
            if not re.fullmatch(r'[A-Z][A-Z0-9]*-\d{3}', original_id):
                continue
            cases.append(dict(id='PLAN-' + original_id, originalId=original_id, group=group,
                title=clean(row[1].value), steps=clean(row[2].value), expected=clean(row[3].value),
                precondition=clean(row[4].value), input='Theo kịch bản mẫu; cần tạo fixture phù hợp source hiện tại.',
                type='N', role='Theo module', level='Manual plan (reference)', source=f'{template.name}#{group}!A{row[0].row}',
                status='Pending', actual='Kế hoạch lấy từ mẫu; chưa chạy lại với fixture hiện tại. Không kế thừa PASS/FAIL lịch sử.',
                evidence='', durationMs=0))
    book.close()
    # Recover N/A/B classification from the unit template where the same case order is used.
    unit = template.parent / 'OJT_RPA_Unit_Test_Demo.xlsx'
    if unit.exists():
        book = load_workbook(unit)
        for group in GROUPS:
            sheet = book[group]
            row_type = next((r for r in range(9, min(sheet.max_row, 200)) if sheet.cell(r, 1).value == 'Result'), None)
            if row_type:
                group_cases = [c for c in cases if c['group'] == group]
                for index, case in enumerate(group_cases):
                    kind = sheet.cell(row_type, index + 5).value
                    if kind in ('N', 'A', 'B'):
                        case['type'] = kind
        book.close()
    return cases


def header(sheet, row, labels, start=1):
    for column, label in enumerate(labels, start):
        cell = sheet.cell(row, column, label)
        cell.fill = PatternFill('solid', fgColor=NAVY)
        cell.font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
    sheet.row_dimensions[row].height = 32


def title(sheet, text, end=8):
    sheet.merge_cells(start_row=1, start_column=1, end_row=1, end_column=end)
    cell = sheet.cell(1, 1, text)
    cell.font = Font(name='Calibri', bold=True, color='FFFFFF', size=17)
    cell.fill = PatternFill('solid', fgColor=NAVY)
    cell.alignment = Alignment(vertical='center')
    sheet.row_dimensions[1].height = 34


def body(sheet, start=1):
    for row in sheet.iter_rows(min_row=start):
        for cell in row:
            if cell.value is None:
                continue
            if not cell.has_style:
                cell.font = Font(name='Calibri', size=11)
            cell.alignment = Alignment(vertical='top', wrap_text=True)
            cell.border = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
    sheet.sheet_view.showGridLines = False
    sheet.sheet_properties.pageSetUpPr.fitToPage = True
    sheet.page_setup.orientation = 'landscape'
    sheet.page_setup.paperSize = sheet.PAPERSIZE_A3
    sheet.page_setup.fitToWidth = 1
    sheet.page_setup.fitToHeight = 0


def formula(bookkey, sheet, address, expression, cached):
    sheet[address] = expression
    FORMULAS.setdefault(bookkey, {}).setdefault(sheet.title, {})[address] = cached


def save_with_cache(book, destination, bookkey):
    """Keep editable Excel formulas and seed their cached numeric results for viewers."""
    for sheet in book:
        allowed_formulas = FORMULAS.get(bookkey, {}).get(sheet.title, {})
        for row in sheet:
            for cell in row:
                if cell.data_type == 'f' and cell.coordinate not in allowed_formulas:
                    cell.data_type = 's'
    book.calculation = CalcProperties(calcMode='auto', fullCalcOnLoad=True, forceFullCalc=True)
    book.save(destination)
    namespace = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    replacements = {}
    with ZipFile(destination) as archive:
        for index, sheet in enumerate(book, 1):
            values = FORMULAS.get(bookkey, {}).get(sheet.title, {})
            if not values:
                continue
            filename = f'xl/worksheets/sheet{index}.xml'
            root = ET.fromstring(archive.read(filename))
            for cell in root.findall('.//s:c', namespace):
                ref = cell.get('r')
                if ref in values and cell.find('s:f', namespace) is not None:
                    val = cell.find('s:v', namespace)
                    if val is None:
                        val = ET.SubElement(cell, '{' + namespace['s'] + '}v')
                    val.text = str(values[ref])
            replacements[filename] = ET.tostring(root, encoding='utf-8', xml_declaration=True)
        entries = [(item, replacements.get(item.filename, archive.read(item.filename))) for item in archive.infolist()]
    with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
        for item, content in entries:
            archive.writestr(item, content)


def cover(book, manifest, date):
    sheet = book.create_sheet('Cover')
    title(sheet, 'OJT-RPA | TEST REPORT DOCUMENT', 6)
    fields = [('Project Name', PROJECT), ('Project Code', 'FA26IS03'), ('Document Code', 'FA26IS03_QA_v1.0'),
              ('Creator', 'Codex — automated execution; chưa có người duyệt'), ('Issue Date', date), ('Version', 'v1.0'),
              ('Run ID', manifest.get('runId', 'manual')), ('Timezone', 'Asia/Ho_Chi_Minh (UTC+07:00)'),
              ('Git HEAD', manifest.get('gitHead', 'Not recorded')), ('Working tree modified', str(manifest.get('dirty', True))),
              ('Source SHA256', manifest.get('sourceHash', 'Not recorded')),
              ('Evidence scope', 'Chỉ các testcase có bằng chứng trong lần chạy hiện tại được ghi Passed/Failed. Kết quả UI/lịch sử trong mẫu chỉ là tài liệu tham chiếu.'),
              ('Limits', 'Không chạy toàn bộ backend/DB vì có reset. Database thật chỉ đọc. Thao tác ghi liên role, AI/email thật và tính đúng mô hình còn nằm trong kế hoạch Pending.')]
    for row, (key, value) in enumerate(fields, 3):
        sheet.cell(row, 1, key)
        sheet.merge_cells(start_row=row, start_column=2, end_row=row, end_column=6)
        sheet.cell(row, 2, value)
        sheet.row_dimensions[row].height = 34 if len(str(value)) > 90 else 24
    sheet.column_dimensions['A'].width = 27
    for col in 'BCDEF':
        sheet.column_dimensions[col].width = 24
    body(sheet)


def append_context(book, cases, manifest, directory):
    sheet = book.create_sheet('Execution Evidence')
    title(sheet, 'CURRENT RUN | EVIDENCE REGISTER', 8)
    header(sheet, 3, ['Case ID', 'Level', 'Role', 'Status', 'Actual result', 'Evidence file', 'Source under test', 'Duration ms'])
    for row, case in enumerate([c for c in cases if not c['id'].startswith('PLAN-')], 4):
        for col, key in enumerate(['id', 'level', 'role', 'status', 'actual', 'evidence', 'source', 'durationMs'], 1):
            sheet.cell(row, col, clean(case.get(key, '')) if key != 'durationMs' else case.get(key, 0))
        sheet.cell(row, 4).fill = PatternFill('solid', fgColor=COLORS[case['status']])
        sheet.row_dimensions[row].height = 48
    for col, width in zip('ABCDEFGH', [34, 22, 24, 14, 75, 85, 70, 15]):
        sheet.column_dimensions[col].width = width
    sheet.freeze_panes = 'E4'
    sheet.auto_filter.ref = f'A3:H{sheet.max_row}'
    body(sheet)

    matrix = book.create_sheet('5-Role Matrix')
    title(matrix, 'FIVE ROLES | CURRENT AUTHENTICATION AND ACCESS', 11)
    header(matrix, 3, ['Role', 'Email', 'Login API', 'Current identity', 'Browser login/reload/guard', 'Browser page navigation', 'ADMIN API', 'ACADEMIC API', 'COORD API', 'STUDENT API', 'ENTERPRISE API'])
    case_by_id = {case['id']: case for case in cases}
    for role, email in [('ADMIN', 'admin@ojtrpa.edu.vn'), ('ACADEMIC', 'academic@ojtrpa.edu.vn'), ('OJT_COORD', 'ojt.coord@ojtrpa.edu.vn'), ('STUDENT', 'student01@student.edu.vn'), ('ENTERPRISE', 'hr@techviet.example')]:
        key = role.replace('_', '-')
        ids = [f'LIVE-LOGIN-{key}', f'LIVE-ME-{key}', f'UI-LOGIN-{key}', f'UI-PAGES-{key}', *[f'LIVE-ACCESS-{key}-{endpoint}' for endpoint in ['ADMIN', 'ACADEMIC', 'COORD', 'STUDENT', 'ENTERPRISE']]]
        row = matrix.max_row + 1
        matrix.cell(row, 1, role); matrix.cell(row, 2, email)
        for col, case_id in enumerate(ids, 3):
            case = case_by_id.get(case_id)
            status = case['status'] if case else 'Pending'
            matrix.cell(row, col, status + '\n' + case_id)
            matrix.cell(row, col).fill = PatternFill('solid', fgColor=COLORS[status])
        matrix.row_dimensions[row].height = 65
    matrix['A10'] = 'Meaning'
    matrix['B10'] = 'Access Passed includes correct rejection (403) for roles that must be denied. See individual testcase expected/actual; it does not mean that every role may access every resource.'
    for col in range(1, 12): matrix.column_dimensions[get_column_letter(col)].width = 32
    matrix.column_dimensions['B'].width = 42
    body(matrix)

    findings = book.create_sheet('Findings & Limits')
    title(findings, 'FINDINGS AND RETEST CONDITIONS', 5)
    header(findings, 3, ['ID', 'Classification', 'Affected checkpoints', 'Observation / source', 'Required next step'])
    for item in load_json(ROOT / 'qa/limitations.json', {'items': []})['items']:
        findings.append([item['id'], item['classification'], item['affected'], item['observation'] + '\nSource: ' + item['source'], item['nextStep']])
    findings.append(['SCOPE-WRITES', 'Not executed', 'Live create/edit/delete/publish; cross-role applications/tasks/results', 'Real DB used read-only; unit mock assertions only for write logic.', 'Use isolated writable fixtures and assert state before/after on both roles.'])
    findings.append(['SCOPE-AI-MAIL', 'Not executed', 'External AI/email; AI prediction quality', 'Deterministic early-warning and schema checks do not prove external service execution or model quality.', 'Separate service integration fixtures, expected outputs and model evaluation dataset.'])
    for col, width in [('A', 24), ('B', 35), ('C', 70), ('D', 100), ('E', 100)]: findings.column_dimensions[col].width = width
    for row in range(4, findings.max_row + 1): findings.row_dimensions[row].height = 100
    body(findings)

    history = book.create_sheet('Historical Evidence')
    title(history, 'REFERENCE ONLY | NOT CURRENT PASS/FAIL', 3)
    header(history, 3, ['Topic', 'Historical workbook claim', 'Current interpretation / action'])
    notes = load_json(ROOT / 'qa/history-notes.json')['items']
    for row, note in enumerate(notes, 4):
        history.append([note['topic'], note['reported'], note['currentAction']])
        history.row_dimensions[row].height = 65
    for col, width in [('A', 36), ('B', 75), ('C', 105)]:
        history.column_dimensions[col].width = width
    body(history)

    checkpoints = book.create_sheet('Historical UI Checkpoints')
    title(checkpoints, 'USER-SUPPLIED HISTORY | NO CURRENT EXECUTION CLAIM', 8)
    header(checkpoints, 3, ['Source sheet / row', 'Checkpoint', 'Role / module', 'Scenario', 'Reported status', 'Reported observation / note', 'Phase / date', 'Attribution'])
    template = ROOT / 'qa/templates/OJT_RPA_Test_Report_Demo.xlsx'
    if template.exists():
        original = load_workbook(template, data_only=True)
        for name in ['UI Evidence 2026-11-21', 'Latest UI Checks']:
            if name not in original.sheetnames:
                continue
            start = 5 if name.startswith('UI Evidence') else 2
            for row in original[name].iter_rows(min_row=start, max_col=7):
                values = [cell.value for cell in row]
                if not values[0]:
                    continue
                if name.startswith('UI Evidence'):
                    case_id, role, scenario, status, note, phase, day = values
                    observation, date_text = note, f'{phase}; {day}'
                else:
                    case_id, role, scenario, observation, status, day, note = values
                    observation, date_text = f'{observation}; {note}', str(day)
                checkpoints.append([f'{name}!A{row[0].row}', case_id, role, scenario, status, observation, date_text, 'Workbook supplied by user; not rerun evidence.'])
        original.close()
    for col, width in zip('ABCDEFGH', [42, 25, 28, 90, 23, 110, 35, 55]): checkpoints.column_dimensions[col].width = width
    for row in range(4, checkpoints.max_row + 1): checkpoints.row_dimensions[row].height = 70
    checkpoints.freeze_panes = 'D4'
    body(checkpoints)

    coverage = book.create_sheet('Code Coverage')
    title(coverage, 'V8 COVERAGE | SELECTED SOURCE FILES ONLY', 7)
    header(coverage, 3, ['Scope', 'Statements %', 'Branches %', 'Functions %', 'Lines %', 'Evidence', 'Limit'])
    for prefix in ['backend', 'frontend']:
        filename = directory / f'coverage/{prefix}/coverage-summary.json'
        data = load_json(filename, {})
        for key, value in data.items():
            coverage.append([f'{prefix}: {relative(key) if key != "total" else "SELECTED FILE TOTAL"}',
                *[value[k]['pct'] for k in ['statements', 'branches', 'functions', 'lines']], relative(filename),
                'Phạm vi include trong vitest.config; không phải độ bao phủ toàn hệ thống.'])
    for col, width in [('A', 90), ('B', 18), ('C', 18), ('D', 18), ('E', 18), ('F', 80), ('G', 70)]:
        coverage.column_dimensions[col].width = width
    body(coverage)

    checks = book.create_sheet('Build & Environment')
    title(checks, 'BUILD, TOOLCHAIN AND ENVIRONMENT', 5)
    header(checks, 3, ['Step', 'Exit code', 'Started UTC', 'Ended UTC', 'Log'])
    for step in manifest.get('steps', []):
        checks.append([step['name'], step['exitCode'], step['startedAt'], step['endedAt'], relative(directory / (step['name'] + '.log'))])
    for col, width in [('A', 28), ('B', 15), ('C', 32), ('D', 32), ('E', 90)]:
        checks.column_dimensions[col].width = width
    body(checks)


def make_test_report(cases, manifest, date, directory, destination):
    key = 'report'
    book = Workbook(); book.remove(book.active)
    cover(book, manifest, date)
    listing = book.create_sheet('Test cases')
    title(listing, 'TEST CASE LIST', 6)
    listing['B3'], listing['D3'] = 'Project Name', PROJECT
    listing['B4'], listing['D4'] = 'Project Code', 'FA26IS03'
    listing['B5'], listing['D5'] = 'Environment', 'Node.js/TypeScript; PostgreSQL; React/Vite; Vitest+Supertest+Testing Library+Playwright Chromium; Python/openpyxl.'
    header(listing, 8, ['No', 'Function / Module', 'Sheet', 'Description'], 2)
    stats = book.create_sheet('Test Statistics')
    title(stats, 'TEST STATISTICS | CURRENT EXECUTION', 12)
    stats['B3'], stats['C3'], stats['E3'], stats['G3'] = 'Project', 'FA26IS03', 'Creator', 'Codex / review pending'
    stats['B5'], stats['C5'], stats['E5'], stats['G5'] = 'Run', manifest.get('runId', 'manual'), 'Date (VN)', date
    header(stats, 9, ['No', 'Module', 'Passed', 'Failed', 'Pending', 'Blocked', 'Total', 'N', 'A', 'B'], 2)
    for index, group in enumerate(GROUPS, 1):
        selected = [c for c in cases if c['group'] == group]
        counts = Counter(c['status'] for c in selected)
        sheet = book.create_sheet(group)
        sheet['A2'], sheet['B2'] = 'Feature', group
        sheet['A3'], sheet['B3'] = 'Test requirement', ' + '.join(sorted(set(c['level'] for c in selected)))
        sheet['A4'], sheet['B4'] = 'Number of TCs', len(selected)
        header(sheet, 5, ['Testing Round', 'Passed', 'Failed', 'Pending', 'N/A', 'Blocked'])
        sheet['A6'] = 'Current run'
        end = 10 + len(selected)
        for address, status in [('B6', 'Passed'), ('C6', 'Failed'), ('D6', 'Pending'), ('F6', 'Blocked')]:
            formula(key, sheet, address, f'=COUNTIF($F$11:$F${end},"{status}")', counts[status])
        sheet['E6'] = 0
        sheet['A7'] = 'Round 2 / Round 3'
        sheet['B7'] = 'Pending: các cột retest để trống cho đến khi có lần chạy riêng.'
        labels = ['Test Case ID', 'Test Case Description', 'Test Case Procedure / Input', 'Expected Results', 'Pre-conditions',
                  'Round 1', 'Test date (VN)', 'Tester', 'Round 2', 'Test date', 'Tester', 'Round 3', 'Test date', 'Tester',
                  'Note / limits', 'N/A/B', 'Role', 'Test level', 'Actual result', 'Source', 'Evidence']
        header(sheet, 10, labels)
        for row, case in enumerate(selected, 11):
            executed = case['status'] in ('Passed', 'Failed')
            values = [case['id'], case['title'], case['steps'] + '\nInput: ' + case['input'], case['expected'], case['precondition'],
                      case['status'], date if executed else '', 'Codex automation' if executed else '', '', '', '', '', '', '',
                      'Template plan; requires independent execution.' if case['id'].startswith('PLAN-') else 'Current run; scope restricted to listed assertions.',
                      case['type'], case['role'], case['level'], case['actual'], case['source'], case['evidence']]
            for col, value in enumerate(values, 1):
                sheet.cell(row, col, clean(value))
            sheet.cell(row, 6).fill = PatternFill('solid', fgColor=COLORS[case['status']])
            sheet.row_dimensions[row].height = 96
        for col, width in zip('ABCDEFGHIJKLMNOPQRSTU', [35, 57, 76, 70, 65, 15, 20, 23, 15, 18, 20, 15, 18, 20, 55, 10, 25, 24, 80, 80, 100]):
            sheet.column_dimensions[col].width = width
        sheet.freeze_panes = 'C11'
        sheet.auto_filter.ref = f'A10:U{end}'
        sheet.print_title_rows = '1:10'
        sheet.print_area = f'A1:U{end}'
        body(sheet, 2)
        listrow = index + 8
        for col, value in [(2, index), (3, group), (4, group), (5, f'{len(selected)} cases; executable cases plus reference plan; live/UI evidence separated by level.')]:
            listing.cell(listrow, col, value)
        listing.cell(listrow, 4).hyperlink = f"#'{group}'!A2"
        listing.cell(listrow, 4).style = 'Hyperlink'
        row = index + 9
        stats.cell(row, 2, index); stats.cell(row, 3, group)
        for col, ref, status in [('D', 'B6', 'Passed'), ('E', 'C6', 'Failed'), ('F', 'D6', 'Pending'), ('G', 'F6', 'Blocked')]:
            formula(key, stats, f'{col}{row}', f"='{group}'!{ref}", counts[status])
        formula(key, stats, f'H{row}', f"='{group}'!B4", len(selected))
        for col, kind in [('I', 'N'), ('J', 'A'), ('K', 'B')]:
            formula(key, stats, f'{col}{row}', f'=COUNTIF(\'{group}\'!P11:P{end},"{kind}")', sum(c['type'] == kind for c in selected))
    counts = Counter(c['status'] for c in cases)
    stats['C18'] = 'Sub total'
    for col, value in zip('DEFGHIJK', [counts['Passed'], counts['Failed'], counts['Pending'], counts['Blocked'], len(cases), *[sum(c['type'] == k for c in cases) for k in 'NAB']]):
        formula(key, stats, col + '18', f'=SUM({col}10:{col}17)', value)
    for row, label, expression, value in [
        (20, 'Execution coverage (cases; NOT code)', '=IFERROR((D18+E18)/H18*100,0)', (counts['Passed'] + counts['Failed']) / len(cases) * 100),
        (21, 'Pass rate among executed', '=IFERROR(D18/(D18+E18)*100,0)', counts['Passed'] / max(1, counts['Passed'] + counts['Failed']) * 100),
        (22, 'Passed / all planned cases', '=IFERROR(D18/H18*100,0)', counts['Passed'] / len(cases) * 100),
    ]:
        stats.cell(row, 3, label); formula(key, stats, f'D{row}', expression, value)
    listing.column_dimensions['B'].width = 10
    for col, width in [('C', 40), ('D', 40), ('E', 105)]: listing.column_dimensions[col].width = width
    for col in 'DEFGHIJK': stats.column_dimensions[col].width = 17
    stats.column_dimensions['B'].width = 10; stats.column_dimensions['C'].width = 55
    body(listing); body(stats)
    append_context(book, cases, manifest, directory)
    save_with_cache(book, destination, key)


def make_unit_report(cases, manifest, date, directory, destination):
    key = 'unit'
    selected_cases = [c for c in cases if c['level'] in ('Unit', 'Component', 'Manual plan (reference)')]
    book = Workbook(); book.remove(book.active)
    guide = book.create_sheet('Guideline')
    title(guide, 'GUIDELINE | UNIT TEST CASES', 4)
    for line in [
        'N = Normal; A = Abnormal; B = Boundary. P = Passed; F = Failed; U = Pending; BL = Blocked.',
        'Mỗi cột là một testcase; giữ cấu trúc matrix của file mẫu. Chi tiết có ở sheet Case Details.',
        'Mẫu chỉ cung cấp định dạng và kế hoạch; không coi trạng thái lịch sử là kết quả lần chạy này.',
        'Chỉ Unit/Component và kế hoạch mẫu nằm trong file này; API/Database/Browser xem Test_Report_Current.xlsx.',
        'Execution coverage là tỷ lệ testcase đã chạy; code coverage V8 chỉ áp dụng các file đã cấu hình include.',
        'PLAN-* là kế hoạch từ mẫu, chưa được chạy lại. Các testcase gần giống nhau ở tầng khác nhau không thay thế nhau.',
        'Unit test mock database/email/AI. Không khẳng định nghiệp vụ ghi, gửi email thật hay độ chính xác mô hình đã đạt.',
    ]: guide.append([line])
    guide.column_dimensions['A'].width = 140
    body(guide, 2)
    cover(book, manifest, date)
    listing = book.create_sheet('Functions')
    title(listing, 'FUNCTION LIST', 6)
    header(listing, 9, ['No', 'Requirement Name', 'Module / Source', 'Test Suite', 'Sheet Name', 'Description'])
    stats = book.create_sheet('Statistics')
    title(stats, 'UNIT TEST REPORT | CURRENT RUN', 9)
    header(stats, 10, ['No', 'Function / Suite', 'Passed', 'Failed', 'Untested', 'N', 'A', 'B', 'Total'])
    for index, group in enumerate(GROUPS, 1):
        rows = [c for c in selected_cases if c['group'] == group]
        counts = Counter(c['status'] for c in rows)
        sheet = book.create_sheet(group)
        pairs = [('A2', 'Suite Code'), ('C2', f'UT-{index:02d}'), ('E2', 'Test Suite'), ('K2', group),
                 ('A3', 'Created By'), ('C3', 'Codex automation'), ('E3', 'Executed By'), ('K3', 'Codex; reviewer unassigned'),
                 ('A4', 'Test requirement'), ('C4', 'Current-source unit/component assertions and reference plans; details in Case Details.'),
                 ('A5', 'Passed'), ('C5', 'Failed'), ('E5', 'Untested'), ('K5', 'N/A/B'), ('N5', 'Total Test Cases'),
                 ('A7', 'Function / Source'), ('A8', 'Test Case ID'), ('A9', 'Condition'), ('B9', 'Precondition'),
                 ('A11', 'Input'), ('A13', 'Confirm'), ('B13', 'Expected result'), ('A15', 'Result'), ('B15', 'Type (N/A/B)'),
                 ('B16', 'Passed / Failed / Untested'), ('B17', 'Executed Date (VN)'), ('B18', 'Defect / Actual'), ('B19', 'Evidence')]
        for address, value in pairs: sheet[address] = value
        last = get_column_letter(len(rows) + 4)
        for addr, expr, value in [
            ('A6', f'=COUNTIF(E16:{last}16,"P")', counts['Passed']), ('C6', f'=COUNTIF(E16:{last}16,"F")', counts['Failed']),
            ('E6', '=N6-A6-C6', len(rows) - counts['Passed'] - counts['Failed']),
            *[(f'{col}6', f'=COUNTIF(E15:{last}15,"{kind}")', sum(c['type'] == kind for c in rows)) for col, kind in [('K', 'N'), ('L', 'A'), ('M', 'B')]],
        ]: formula(key, sheet, addr, expr, value)
        sheet['N6'] = len(rows)
        for col, case in enumerate(rows, 5):
            state = {'Passed': 'P', 'Failed': 'F', 'Pending': 'U', 'Blocked': 'BL'}[case['status']]
            for row, value in [(7, case['source']), (8, case['id']), (10, case['precondition']), (12, case['input']), (14, case['expected']),
                               (15, case['type']), (16, state), (17, date if state in ('P', 'F') else ''), (18, case['actual']), (19, case['evidence'])]:
                sheet.cell(row, col, clean(value))
            sheet.cell(16, col).fill = PatternFill('solid', fgColor=COLORS[case['status']])
            sheet.column_dimensions[get_column_letter(col)].width = 35
        for col, width in [('A', 24), ('B', 30), ('C', 10), ('D', 10)]: sheet.column_dimensions[col].width = width
        for row, height in [(7, 90), (8, 36), (10, 140), (12, 115), (14, 130), (18, 130), (19, 110)]: sheet.row_dimensions[row].height = height
        sheet.freeze_panes = 'E9'; sheet.print_title_cols = 'A:D'
        sheet.print_area = f'A1:{last}19'
        body(sheet, 2)
        row = 9 + index
        for col, value in enumerate([index, group, '\n'.join(sorted(set(c['source'] for c in rows if not c['id'].startswith('PLAN-')))), group, group, f'{len(rows)} cases; see Case Details for steps and current evidence.'], 1): listing.cell(row, col, value)
        listing.cell(row, 5).hyperlink = f"#'{group}'!A2"; listing.cell(row, 5).style = 'Hyperlink'
        row = 10 + index; stats.cell(row, 1, index); stats.cell(row, 2, group)
        for col, ref, value in [('C', 'A6', counts['Passed']), ('D', 'C6', counts['Failed']), ('E', 'E6', len(rows) - counts['Passed'] - counts['Failed']),
                                *[(col, ref, sum(c['type'] == kind for c in rows)) for col, ref, kind in [('F', 'K6', 'N'), ('G', 'L6', 'A'), ('H', 'M6', 'B')]], ('I', 'N6', len(rows))]:
            formula(key, stats, f'{col}{row}', f"='{group}'!{ref}", value)
    counts = Counter(c['status'] for c in selected_cases)
    stats['B19'] = 'Sub total'
    for col, value in zip('CDEFGHI', [counts['Passed'], counts['Failed'], len(selected_cases) - counts['Passed'] - counts['Failed'], *[sum(c['type'] == kind for c in selected_cases) for kind in 'NAB'], len(selected_cases)]):
        formula(key, stats, col + '19', f'=SUM({col}11:{col}18)', value)
    stats['B21'] = 'Execution coverage (cases)'
    formula(key, stats, 'D21', '=IFERROR((C19+D19)*100/I19,0)', (counts['Passed'] + counts['Failed']) / len(selected_cases) * 100)
    stats['B22'] = 'Passed / all planned cases'
    formula(key, stats, 'D22', '=IFERROR(C19*100/I19,0)', counts['Passed'] / len(selected_cases) * 100)
    for col, width in [('A', 10), ('B', 36), ('C', 80), ('D', 36), ('E', 36), ('F', 90)]: listing.column_dimensions[col].width = width
    stats.column_dimensions['B'].width = 42
    for col in 'ACDEFGHI': stats.column_dimensions[col].width = 16
    body(listing); body(stats)
    details = book.create_sheet('Case Details')
    title(details, 'UNIT / COMPONENT CASE DETAILS', 12)
    keys = ['id', 'group', 'title', 'type', 'role', 'level', 'precondition', 'input', 'steps', 'expected', 'status', 'source']
    header(details, 3, keys)
    for case in selected_cases: details.append([case.get(k, '') for k in keys])
    for col in range(1, 13): details.column_dimensions[get_column_letter(col)].width = 55 if col > 6 else 28
    details.freeze_panes = 'C4'; details.auto_filter.ref = f'A3:L{details.max_row}'
    body(details)
    save_with_cache(book, destination, key)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--results', type=Path)
    args = parser.parse_args()
    latest = load_json(ROOT / 'qa/results/latest.json', {})
    directory = (args.results or Path(latest.get('directory', ROOT / 'qa/results/manual'))).resolve()
    manifest = load_json(directory / 'run.json', {'runId': directory.name, 'startedAt': datetime.now(timezone.utc).isoformat()})
    date = datetime.fromisoformat(manifest['startedAt'].replace('Z', '+00:00')).astimezone(VIETNAM).strftime('%d/%m/%Y')
    results = parse_results(directory)
    catalog = [load_json(f) for f in sorted((directory / 'catalog').glob('*.json'))]
    if not catalog:
        raise ValueError('No collected testcase catalog; execute the tests before exporting reports.')
    metadata_ids = [c['id'] for c in catalog]
    if len(metadata_ids) != len(set(metadata_ids)):
        raise ValueError('Duplicate testcase IDs')
    if set(results) - set(metadata_ids):
        raise ValueError(f'Results without testcase metadata: {set(results) - set(metadata_ids)}')
    observations = load_json(directory / 'live-observations.json', {})
    for case in catalog:
        case.update(results.get(case['id'], dict(status='Pending', actual='No execution result in this run.', evidence='', durationMs=0)))
        if case['id'] in observations:
            case['actual'] += '\nObserved: ' + json.dumps(observations[case['id']], ensure_ascii=False)
        case['actual'] = clean(case['actual'])
        if case['group'] not in GROUPS:
            raise ValueError(f'Unknown module group: {case["group"]}')
    cases = catalog + planned_cases(ROOT / 'qa/templates/OJT_RPA_Test_Report_Demo.xlsx')
    reports = ROOT / 'qa/reports'; reports.mkdir(exist_ok=True)
    make_unit_report(cases, manifest, date, directory, reports / 'OJT_RPA_Unit_Test_Current.xlsx')
    make_test_report(cases, manifest, date, directory, reports / 'OJT_RPA_Test_Report_Current.xlsx')
    summary = dict(runId=manifest['runId'], executionDateVietnam=date, total=len(cases),
        automated=dict(Counter(c['status'] for c in catalog)), plannedReference=len(cases) - len(catalog),
        allStatuses=dict(Counter(c['status'] for c in cases)),
        byLevel={level: dict(Counter(c['status'] for c in catalog if c['level'] == level)) for level in sorted(set(c['level'] for c in catalog))},
        builds={step['name']: step['exitCode'] for step in manifest.get('steps', []) if step['name'].endswith('-build')},
        files=[{'name': f.name, 'sha256': hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(reports.glob('*.xlsx'))])
    (reports / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    (directory / 'normalized-cases.json').write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding='utf-8')
    (reports / 'execution-summary.txt').write_text(
        f'OJT-RPA | Run {manifest["runId"]} | {date} (Asia/Ho_Chi_Minh)\n'
        + json.dumps(summary['byLevel'], ensure_ascii=False, indent=2)
        + f'\nReference plan cases: {summary["plannedReference"]}; all remain Pending.\n'
        + 'Code coverage applies only to selected source files; see Code Coverage sheet.\n'
        + 'Database integration: read-only. No production data reset, workflow writes, real mail delivery or AI model accuracy claimed.\n', encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
