import os, json, subprocess
import psycopg2
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from ortools.sat.python import cp_model

# ------------------------------------------------------------
#  ENV + APP SETUP
# ------------------------------------------------------------
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173","http://127.0.0.1:5173",
    "http://localhost:5174","http://127.0.0.1:5174"
]}})

DB_DSN = os.getenv("DB_DSN", "postgresql://postgres:postgres@127.0.0.1:5432/tt")
DEFAULT_P = int(os.getenv("PERIODS_PER_DAY", "6"))
HF_URL = os.getenv("HF_URL", "").strip()
DAY_NAME = ["Mon","Tue","Wed","Thu","Fri"]

# ------------------------------------------------------------
#  HELPERS
# ------------------------------------------------------------
def q(cur, sql, args=None):
    cur.execute(sql, args or ())
    return cur.fetchall()

CPP_PATH = os.path.join(os.path.dirname(__file__), "bin", "timetable_generator.exe")
if not os.path.exists(CPP_PATH):  # linux/mac fallback
    CPP_PATH = os.path.join(os.path.dirname(__file__), "bin", "timetable_generator")

# ------------------------------------------------------------
#  C++ TEMPLATE INTERFACE
# ------------------------------------------------------------
def fetch_phase_inputs(cur, phase_num: int, P: int):
    cur.execute("""SELECT subject_name, credits FROM subjects ORDER BY subject_id""")
    subs = [{"name": s, "credits": int(c)} for (s, c) in cur.fetchall()]
    if not subs:
        subs = [{"name":"DBMS","credits":4},{"name":"OS","credits":3},{"name":"ALGO","credits":4}]

    cur.execute("SELECT COUNT(*) FROM sections")
    batches = cur.fetchone()[0] or 1

    policy = {1:(6,8), 2:(4,5), 3:(2,3)}.get(phase_num, (4,5))

    return {
        "department": "CSE",
        "semester": 5,
        "batches": batches,
        "semesterStart": "2025-07-15",
        "semesterEnd":   "2025-12-05",
        "periods_per_day": P,
        "min_classes_per_day": policy[0],
        "max_classes_per_day": policy[1],
        "subjects": subs
    }

def call_cpp_phase_template(payload: dict) -> dict:
    try:
        p = subprocess.run(
            [CPP_PATH],
            input=json.dumps(payload).encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        return json.loads(p.stdout.decode("utf-8"))
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"C++ timetable_generator failed:\n{e.stderr.decode('utf-8','ignore')}")

def template_match_weight(template_json) -> dict:
    want = {}
    for sec in template_json.get("sections", []):
        sname = sec["section"]
        table = sec.get("table", {})
        for d, day in enumerate(DAY_NAME):
            row = table.get(day, []) or []
            for p, subj in enumerate(row):
                subj = (subj or "").strip()
                if subj:
                    want.setdefault((sname, d, p), set()).add(subj)
    return want

# ------------------------------------------------------------
#  CORE BUILDER (DB + ORTOOLS + TEMPLATE + OPTIONAL ML)
# ------------------------------------------------------------
def build_schedule_with_template_and_ml(periods_per_day: int, phase: int = 1):
    P = periods_per_day
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()

    # DB fetches
    sections = q(cur, "SELECT section_id, section_name FROM sections ORDER BY section_id")
    if not sections: return {"status":"no_sections"}
    section_by_id = {sid: sname for (sid,sname) in sections}

    subjects = q(cur, "SELECT subject_id, subject_code, subject_name FROM subjects")
    subj_by_id = {sid:(code,name) for (sid,code,name) in subjects}
    if not subjects: return {"status":"no_subjects"}

    demand = q(cur, """
        SELECT section_id, subject_id, weekly_classes
        FROM section_subject ORDER BY section_id, subject_id
    """)
    if not demand: return {"status":"no_demand_config"}

    faculty = q(cur, "SELECT faculty_id, faculty_name FROM faculty")
    fac_ids = [f[0] for f in faculty]
    if not faculty: return {"status":"no_faculty"}

    fac_sub = set(q(cur, "SELECT faculty_id, subject_id FROM faculty_subject"))

    rooms = q(cur, "SELECT room_id, room_name FROM classrooms")
    room_ids = [r[0] for r in rooms]
    if not rooms: return {"status":"no_rooms"}

    blocked = set(q(cur, "SELECT faculty_id, day_of_week, period_number FROM faculty_unavailable"))
    cur_load = dict(q(cur, "SELECT faculty_id, COUNT(*) FROM timetable GROUP BY faculty_id"))

    # C++ template
    cpp_payload = fetch_phase_inputs(cur, phase, P)
    cpp_json = call_cpp_phase_template(cpp_payload)
    want = template_match_weight(cpp_json)

    # OR-Tools vars
    model = cp_model.CpModel()
    x = {}
    slot_list = []

    for (sec_id, sub_id, weekly) in demand:
        sec_name = section_by_id[sec_id]
        subj_code, subj_name = subj_by_id[sub_id]
        for fac in fac_ids:
            if (fac, sub_id) not in fac_sub: continue
            for d in range(5):
                for p in range(P):
                    if (fac, DAY_NAME[d], p) in blocked: continue
                    for room in room_ids:
                        key = (sec_id, sub_id, fac, room, d, p)
                        x[key] = model.NewBoolVar(f"x_s{sec_id}_sub{sub_id}_f{fac}_r{room}_d{d}_p{p}")
                        slot_list.append((key, sec_name, subj_name, d, p))
    if not x: return {"status":"no_candidates"}

    # constraints
    by_sec_sub = {}
    for key in x:
        s, sub, *_ = key
        by_sec_sub.setdefault((s, sub), []).append(key)
    for (s, sub), keys in by_sec_sub.items():
        w = next(w for (ss, su, w) in demand if ss == s and su == sub)
        model.Add(sum(x[k] for k in keys) == w)

    by_sec_slot = {}
    for key in x:
        sec, *_ , d, p = key
        by_sec_slot.setdefault((sec, d, p), []).append(key)
    for _, keys in by_sec_slot.items():
        model.Add(sum(x[k] for k in keys) <= 1)

    by_fac_slot = {}
    for key in x:
        _, _, fac, _, d, p = key
        by_fac_slot.setdefault((fac, d, p), []).append(key)
    for _, keys in by_fac_slot.items():
        model.Add(sum(x[k] for k in keys) <= 1)

    by_room_slot = {}
    for key in x:
        _, _, _, room, d, p = key
        by_room_slot.setdefault((room, d, p), []).append(key)
    for _, keys in by_room_slot.items():
        model.Add(sum(x[k] for k in keys) <= 1)

    # objective
    alpha, beta = 1000, 1000
    ml_scores = {}
    if HF_URL:
        slots_for_ml = []
        for (key, sec_name, subj_name, d, p) in slot_list:
            sec, sub, fac, room, dd, pp = key
            slots_for_ml.append({
                "faculty_id": fac, "subject_id": sub, "batch_id": sec,
                "day": dd, "period": pp,
                "current_week_load": int(cur_load.get(fac, 0)),
                "max_load": 30, "recent_adjacent_same": 0, "historical_stress": 0.0
            })
        try:
            r = requests.post(f"{HF_URL}/score", json={"slots": slots_for_ml}, timeout=45)
            r.raise_for_status()
            resp = r.json()
            for i, (key, *_rest) in enumerate(slot_list):
                ml_scores[key] = float(resp[i]["slot_score"])
        except Exception:
            ml_scores = {}

    def w_template(sec_name, subj_name, d, p):
        return 1.0 if subj_name in want.get((sec_name, d, p), set()) else 0.0

    obj_terms = []
    for (key, sec_name, subj_name, d, p) in slot_list:
        tmatch = w_template(sec_name, subj_name, d, p)
        ml     = ml_scores.get(key, 0.0)
        weight = int(round(alpha * tmatch + beta * ml))
        if weight != 0:
            obj_terms.append(weight * x[key])
    model.Maximize(sum(obj_terms) if obj_terms else 0)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 40.0
    res = solver.Solve(model)
    if res not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"status":"no_solution"}

    batches = {}
    for key, var in x.items():
        if solver.Value(var) == 1:
            sec, sub, fac, room, d, p = key
            subj_code, _ = subj_by_id[sub]
            batches.setdefault(sec, {}).setdefault(d, [""]*P)
            batches[sec][d][p] = f"{subj_code}/F{fac}/R{room}"

    return {"status":"ok", "periods_per_day": P, "days": DAY_NAME, "batches": batches}

# ------------------------------------------------------------
#  MAP TO FRONTEND STRUCTURE
# ------------------------------------------------------------
def map_scheduler_to_grouped(sched_json, phase_label="phase1"):
    grouped = {}
    if sched_json.get("status") != "ok": return grouped
    grouped[phase_label] = {}
    days = sched_json.get("days", DAY_NAME)
    for section_id, days_map in sched_json.get("batches", {}).items():
        option = 1
        section_name = f"SEC_{section_id}"
        table_obj = {}
        for d_idx, periods in days_map.items():
            d_idx_int = int(d_idx)
            day_name = days[d_idx_int] if 0 <= d_idx_int < len(days) else f"D{d_idx}"
            table_obj[day_name] = periods
        grouped[phase_label].setdefault(str(section_id), {})
        grouped[phase_label][str(section_id)][option] = {
            "id": f"{phase_label}_{section_id}_{option}",
            "name": section_name,
            "full_name": f"{section_name}_{phase_label}_Option{option}",
            "sections": [{
                "section": section_name,
                "table": table_obj,
                "phase": phase_label,
                "timetable_option": option
            }]
        }
    return grouped

# ------------------------------------------------------------
#  API ROUTES
# ------------------------------------------------------------
@app.route('/api/schedule/generate', methods=['POST'])
def generate_timetable():
    try:
        data = request.json or {}
        P = int(data.get("periods_per_day", DEFAULT_P))
        phase = int(data.get("phase", 1))

        sched_out = build_schedule_with_template_and_ml(P, phase=phase)
        grouped = map_scheduler_to_grouped(sched_out, phase_label=f"phase{phase}")

        summary = {
            "department": data.get("department", "CSE"),
            "semester": data.get("semester", 5),
            "batches": list(grouped.get(f"phase{phase}", {}).keys()),
            "num_phases": 1,
            "options_per_batch": 1
        }
        return jsonify({
            "success": "ok" if sched_out.get("status") == "ok" else "fail",
            "grouped_timetables": grouped,
            "summary": summary
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return {"ok": True}

# ------------------------------------------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5002)
