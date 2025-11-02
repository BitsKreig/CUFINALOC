import os
from ortools.sat.python import cp_model
from .db import q
from .cpp_bridge import call_cpp_template, template_match_lookup, DAY_NAME
ALPHA = int(os.getenv("ALPHA_TEMPLATE", "1000"))
BETA  = int(os.getenv("BETA_ML", "1000"))

def fetch_phase_inputs(cur, phase_num: int, P: int):
    subs = [{"name": s, "credits": int(c)} for (s, c) in q(cur, "SELECT subject_name, credits FROM subjects ORDER BY subject_id")]
    if not subs: subs = [{"name":"DBMS","credits":4},{"name":"OS","credits":3},{"name":"ALGO","credits":4}]
    batches = q(cur, "SELECT COUNT(*) FROM sections")[0][0] or 1
    lo, hi = {1:(6,8), 2:(4,5), 3:(2,3)}.get(phase_num, (4,5))
    return {"department":"CSE","semester":5,"batches":batches,"semesterStart":"2025-07-15","semesterEnd":"2025-12-05",
            "periods_per_day":P,"min_classes_per_day":lo,"max_classes_per_day":hi,"subjects":subs}

def solve_with_policy(conn, cur, P: int, phase: int, policy: dict|None, ml_scores_fn=None):
    sections = q(cur,"SELECT section_id, section_name FROM sections ORDER BY section_id")
    if not sections: return {"status":"no_sections"}
    section_by_id = {sid:s for (sid,s) in sections}
    subjects = q(cur,"SELECT subject_id, subject_code, subject_name FROM subjects")
    if not subjects: return {"status":"no_subjects"}
    subj_by_id = {sid:(code,name) for (sid,code,name) in subjects}
    demand = q(cur,"SELECT section_id, subject_id, weekly_classes FROM section_subject ORDER BY section_id, subject_id")
    if not demand: return {"status":"no_demand"}
    faculty = q(cur,"SELECT faculty_id, faculty_name FROM faculty");  fac_ids=[f[0] for f in faculty]
    if not faculty: return {"status":"no_faculty"}
    fac_name_by_id = {fid:fn for (fid,fn) in faculty}
    fac_sub = set(q(cur,"SELECT faculty_id, subject_id FROM faculty_subject"))
    rooms = q(cur,"SELECT room_id, room_name FROM classrooms"); room_ids=[r[0] for r in rooms]
    if not rooms: return {"status":"no_rooms"}
    blocked = set(q(cur,"SELECT faculty_id, day_of_week, period_number FROM faculty_unavailable"))
    cur_load = dict(q(cur,"SELECT faculty_id, COUNT(*) FROM timetable GROUP BY faculty_id"))

    tjson = call_cpp_template(fetch_phase_inputs(cur, phase, P))
    want = template_match_lookup(tjson)

    model = cp_model.CpModel(); x={}; slot_list=[]
    for (sec_id, sub_id, weekly) in demand:
        sec_name = section_by_id[sec_id]; _, subj_name = subj_by_id[sub_id]
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

    # demand equality
    by_sec_sub={}
    for key in x: s, sub, *_ = key; by_sec_sub.setdefault((s,sub),[]).append(key)
    for (s,sub), keys in by_sec_sub.items():
        w = next(w for (ss,su,w) in demand if ss==s and su==sub)
        model.Add(sum(x[k] for k in keys) == w)

    # no overlaps
    bucket={}
    for key in x:
        sec, _, fac, room, d, p = key
        bucket.setdefault(("sec",sec,d,p),[]).append(key)
        bucket.setdefault(("fac",fac,d,p),[]).append(key)
        bucket.setdefault(("room",room,d,p),[]).append(key)
    for _,keys in bucket.items(): model.Add(sum(x[k] for k in keys) <= 1)

    # policy hard caps
    hard = (policy or {}).get("max_faculty_load", {})
    if hard:
        caps = {fid: hard.get(fac_name_by_id[fid], None) for fid in fac_ids}
        for fid,cap in caps.items():
            if cap is not None: model.Add(sum(x[k] for k in x if k[2]==fid) <= int(cap))

    # objective
    avoid_adj = set((policy or {}).get("avoid_adjacent_subjects", []))
    fri_last_pen = int((policy or {}).get("penalize_friday_last", 0))
    obj=[]
    def w_template(sec_name, subj_name, d, p): return 1 if subj_name in want.get((sec_name,d,p), set()) else 0
    for (key, sec_name, subj_name, d, p) in slot_list:
        w = 0
        w += ALPHA * w_template(sec_name, subj_name, d, p)
        if fri_last_pen and d==4 and p==P-1: w -= fri_last_pen
        if subj_name in avoid_adj: w -= 10
        if w: obj.append(w * x[key])

    if ml_scores_fn:
        scores = ml_scores_fn(slot_list, cur_load)  # dict[key]->[-1,1]
        for (key,*_), s in scores.items():
            if s: obj.append(int(BETA*s) * x[key])

    model.Maximize(sum(obj) if obj else 0)
    solver = cp_model.CpSolver(); solver.parameters.max_time_in_seconds = 40.0
    res = solver.Solve(model)
    if res not in (cp_model.OPTIMAL, cp_model.FEASIBLE): return {"status":"no_solution"}

    batches = {}
    for key,var in x.items():
        if solver.Value(var)==1:
            sec, sub, fac, room, d, p = key
            code,_ = subj_by_id[sub]
            batches.setdefault(sec,{}).setdefault(d,[""]*P)
            batches[sec][d][p] = f"{code}/F{fac}/R{room}"
    return {"status":"ok","periods_per_day":P,"days":DAY_NAME,"batches":batches}
