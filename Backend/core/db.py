import os, psycopg2
from contextlib import contextmanager
DSN = os.getenv("DB_DSN", "postgresql://postgres:postgres@127.0.0.1:5432/tt")
@contextmanager
def db():
    conn = psycopg2.connect(DSN)
    try:
        cur = conn.cursor(); yield conn, cur; conn.commit()
    finally:
        cur.close(); conn.close()
def q(cur, sql, args=None):
    cur.execute(sql, args or ()); return cur.fetchall()
# to be edited 