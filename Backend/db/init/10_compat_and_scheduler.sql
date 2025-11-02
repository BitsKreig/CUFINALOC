-- =========  A) Compatibility VIEWS (no changes to your tables)  =========
-- Your base tables (as you posted):
--   public.batch(batchid BIGINT, semester VARCHAR UNIQUE)
--   public.department(deptid TEXT PK, deptname VARCHAR)
--   public.faculty(facultyid TEXT PK, facultyname VARCHAR, deptid TEXT FK)
--   public.facultysubject(facultyid TEXT, subjectid TEXT, PK(facultyid,subjectid))
--   public.students(studentid TEXT PK, ..., batchid BIGINT FK, deptid TEXT FK)
--   public.subject(subjectid TEXT PK, subjectname VARCHAR, credits INT, deptid TEXT FK)
--   public.users(...)

-- Present them in the shape the backend expects.

CREATE OR REPLACE VIEW departments AS
SELECT
  d.deptid   AS dept_id,     -- keep as TEXT
  d.deptname AS dept_name
FROM public.department d;

CREATE OR REPLACE VIEW faculty AS
SELECT
  f.facultyid   AS faculty_id,   -- TEXT
  f.facultyname AS faculty_name,
  f.deptid      AS dept_id       -- TEXT
FROM public.faculty f;

-- Treat each "batch" as a scheduling "section".
-- section_id stays BIGINT (batchid). section_name uses semester or a readable label.
CREATE OR REPLACE VIEW sections AS
SELECT
  b.batchid      AS section_id,             -- BIGINT
  COALESCE(NULLIF(TRIM(b.semester), ''),    -- prefer given semester label if present
           'BATCH_' || b.batchid::text)     -- fallback human name
  AS section_name
FROM public.batch b;

-- subjects: supply subject_code (use subjectid as code)
CREATE OR REPLACE VIEW subjects AS
SELECT
  s.subjectid    AS subject_id,    -- TEXT
  s.subjectid    AS subject_code,  -- TEXT (code for UI)
  s.subjectname  AS subject_name,
  s.credits      AS credits,
  s.deptid       AS dept_id        -- TEXT
FROM public.subject s;

-- faculty_subject mapping (same keys as above)
CREATE OR REPLACE VIEW faculty_subject AS
SELECT DISTINCT
  fs.facultyid AS faculty_id,   -- TEXT
  fs.subjectid AS subject_id    -- TEXT
FROM public.facultysubject fs;

-- =========  B) Minimal scheduler add-ons (new tables; safe)  =========

-- Rooms inventory (needed for room clash prevention)
CREATE TABLE IF NOT EXISTS public.classrooms (
  room_id   BIGSERIAL PRIMARY KEY,
  room_name TEXT NOT NULL UNIQUE,
  capacity  INT  NOT NULL DEFAULT 60 CHECK (capacity >= 0),
  deptid    TEXT REFERENCES public.department(deptid)
);

-- Weekly demand per section(subject) (how many classes/week required)
-- section_id references batch.batchid (BIGINT)
-- subject_id references subject.subjectid (TEXT)
CREATE TABLE IF NOT EXISTS public.section_subject (
  section_id     BIGINT NOT NULL REFERENCES public.batch(batchid) ON DELETE CASCADE,
  subject_id     TEXT   NOT NULL REFERENCES public.subject(subjectid) ON DELETE CASCADE,
  weekly_classes INT    NOT NULL CHECK (weekly_classes > 0),
  PRIMARY KEY (section_id, subject_id)
);

-- Faculty unavailability (block specific (day,period))
CREATE TABLE IF NOT EXISTS public.faculty_unavailable (
  faculty_id    TEXT NOT NULL REFERENCES public.faculty(facultyid) ON DELETE CASCADE,
  day_of_week   TEXT NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri')),
  period_number INT  NOT NULL CHECK (period_number >= 0),
  PRIMARY KEY (faculty_id, day_of_week, period_number)
);

-- (Optional) Persist a solved timetable snapshot (one row per final slot)
-- Uses the same key types as your base schema.
CREATE TABLE IF NOT EXISTS public.timetable (
  id            BIGSERIAL PRIMARY KEY,
  day_of_week   TEXT NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri')),
  period_number INT  NOT NULL CHECK (period_number >= 0),
  section_id    BIGINT NOT NULL REFERENCES public.batch(batchid),
  subject_id    TEXT   NOT NULL REFERENCES public.subject(subjectid),
  faculty_id    TEXT   NOT NULL REFERENCES public.faculty(facultyid),
  room_id       BIGINT NOT NULL REFERENCES public.classrooms(room_id)
);

-- No-clash guarantees at DB level (safety net for the solver)
CREATE UNIQUE INDEX IF NOT EXISTS ux_timetable_section_slot
  ON public.timetable(section_id, day_of_week, period_number);

CREATE UNIQUE INDEX IF NOT EXISTS ux_timetable_faculty_slot
  ON public.timetable(faculty_id, day_of_week, period_number);

CREATE UNIQUE INDEX IF NOT EXISTS ux_timetable_room_slot
  ON public.timetable(room_id, day_of_week, period_number);

-- =========  C) Tiny seed so you can test right away (safe to re-run) =========

INSERT INTO public.classrooms (room_name, capacity)
VALUES ('R101', 60), ('R102', 60), ('R103', 60)
ON CONFLICT (room_name) DO NOTHING;

-- Example demand for 2 batches, edit names to yours.
-- If you have batches and subjects already, this will attach weekly classes.
WITH b AS (SELECT batchid, semester FROM public.batch),
     u AS (SELECT subjectid, subjectname FROM public.subject)
INSERT INTO public.section_subject (section_id, subject_id, weekly_classes)
SELECT b.batchid, u.subjectid,
       CASE
         WHEN u.subjectname ILIKE '%DBMS%' THEN 3
         WHEN u.subjectname ILIKE '%OS%'   THEN 2
         WHEN u.subjectname ILIKE '%ALGO%' THEN 3
         ELSE 2
       END
FROM b CROSS JOIN u
WHERE b.semester IS NOT NULL
  AND u.subjectname IN ('DBMS','OS','ALGO')  -- adjust to your real names
ON CONFLICT DO NOTHING;
