import sqlite3
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "approvals.db"


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL,
            clause_id TEXT NOT NULL,
            status TEXT NOT NULL,
            reviewer TEXT NOT NULL,
            comment TEXT NOT NULL DEFAULT '',
            edited_text TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(document_id, clause_id)
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS audit_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL,
            action TEXT NOT NULL,
            user TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT NOT NULL,
            detail TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        conn.commit()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def add_audit_event(document_id, action, detail, user="System", role="System", status="Completed"):
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("INSERT INTO audit_events (document_id, action, user, role, status, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                     (document_id, action, user, role, status, detail, now_iso()))
        conn.commit()


def get_audit_history(document_id=None):
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        if document_id:
            rows = conn.execute("SELECT id, document_id, action, user, role, status, detail, created_at FROM audit_events WHERE document_id=? ORDER BY id DESC", (document_id,)).fetchall()
        else:
            rows = conn.execute("SELECT id, document_id, action, user, role, status, detail, created_at FROM audit_events ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]


def get_review(document_id, clause_id):
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT clause_id, status, reviewer, comment, edited_text FROM approvals WHERE document_id=? AND clause_id=?", (document_id, clause_id)).fetchone()
        return dict(row) if row else {"clause_id": clause_id, "status": "pending", "reviewer": "", "comment": "", "edited_text": ""}


def get_pending_reviews():
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT document_id, clause_id, status, reviewer, comment, edited_text FROM approvals WHERE status='pending' ORDER BY created_at ASC").fetchall()
        return [dict(r) for r in rows]


def save_review(document_id, clause_id, status, reviewer, comment="", edited_text=""):
    init_db()
    now = now_iso()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""INSERT INTO approvals (document_id, clause_id, status, reviewer, comment, edited_text, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(document_id, clause_id) DO UPDATE SET status=excluded.status, reviewer=excluded.reviewer,
            comment=excluded.comment, edited_text=excluded.edited_text, updated_at=excluded.updated_at""",
            (document_id, clause_id, status, reviewer, comment, edited_text, now, now))
        conn.commit()
    labels={"approved":"Risk Accepted","rejected":"Risk Rejected","escalated":"Risk Escalated","pending":"Risk Edited"}
    add_audit_event(document_id, labels.get(status,"Review Updated"), f"{clause_id} marked {status} by {reviewer}", reviewer, "Reviewer", "Escalated" if status=="escalated" else "Completed")
    return get_review(document_id, clause_id)
