import sqlite3

conn = sqlite3.connect("data/approvals.db")

cols = [
    row[1]
    for row in conn.execute("PRAGMA table_info(approvals)").fetchall()
]

print("Before:", cols)

if "edited_text" not in cols:
    conn.execute(
        "ALTER TABLE approvals ADD COLUMN edited_text TEXT NOT NULL DEFAULT ''"
    )
    conn.commit()
    print("edited_text added successfully")
else:
    print("edited_text already exists")

cols = [
    row[1]
    for row in conn.execute("PRAGMA table_info(approvals)").fetchall()
]

print("After:", cols)

conn.close()