import os, json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from core.db import db, q
from core.solver import solve_with_policy
from ml.policies import compile_policy_from_prompt

load_dotenv()
app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    supports_credentials=True,
    expose_headers=["Content-Type"],
)
DEFAULT_P = int(os.getenv("PERIODS_PER_DAY","6"))
USE_OLLAMA = os.getenv("USE_OLLAMA","true").lower()=="true"
ML_SLOT_SCORER = os.getenv("ML_SLOT_SCORER","true").lower()=="true"

def simple_slot_scorer(slot_list, cur_load):
    scores={}
    P = DEFAULT_P
    for (key, _, __, d, p) in slot_list:
        _,_,fac,_,dd,pp = key
        s = 0.0
        s += max(0.0, 1.0 - (cur_load.get(fac,0)/30.0))
        if dd==4 and pp==P-1: s -= 0.4
        scores[key] = max(-1.0, min(1.0, s))
    return scores

@app.get("/api/health")
def health(): return {"ok":True}

@app.post("/api/ml/organize")
def ml_organize():
    if not USE_OLLAMA: return jsonify({"error":"Ollama disabled"}), 400
    text = (request.json or {}).get("prompt","").strip()
    if not text: return jsonify({"error":"missing prompt"}), 400
    policy = compile_policy_from_prompt(text); return jsonify({"policy":policy})

@app.post("/api/schedule/generate")
def generate():
    data = request.json or {}
    P = int(data.get("periods_per_day", DEFAULT_P)); phase = int(data.get("phase",1))
    policy = data.get("policy")
    with db() as (conn, cur):
        scorer = simple_slot_scorer if ML_SLOT_SCORER else None
        out = solve_with_policy(conn, cur, P, phase, policy, ml_scores_fn=scorer)
    if out.get("status")!="ok": return jsonify({"success":"fail","reason":out.get("status")}), 200
    days = out["days"]; batches = out["batches"]; phase_key=f"phase{phase}"
    grouped = {phase_key:{}}
    for sec_id,dmap in batches.items():
        section_key=str(sec_id); option=1; table={}
        for d_idx, row in dmap.items(): table[days[int(d_idx)]] = row
        grouped[phase_key][section_key] = {option: {"id":f"{phase_key}_{section_key}_{option}",
            "name":f"SEC_{section_key}","full_name":f"SEC_{section_key}_{phase_key}_Option{option}",
            "sections":[{"section":f"SEC_{section_key}","table":table,"phase":phase_key,"timetable_option":option}]}}
    return jsonify({"success":"ok","grouped_timetables":grouped,
                    "summary":{"department":data.get("department","CSE"),"semester":data.get("semester",5),
                               "batches":list(grouped[phase_key].keys()),"num_phases":1,"options_per_batch":1}}),200

@app.get("/api/faculty/<int:fid>/timetable")
def faculty_view(fid):
    # read latest solved timetable from DB if you persist; for now, rebuild quick view via solver:
    with db() as (conn, cur):
        out = solve_with_policy(conn, cur, DEFAULT_P, 1, {}, ml_scores_fn=None)
    if out.get("status")!="ok": return jsonify({"error":"no timetable"}), 400
    days = out["days"]; P = out["periods_per_day"]; view={}
    for sec_id, dmap in out["batches"].items():
        for d_idx,row in dmap.items():
            for p,cell in enumerate(row):
                if cell and f"/F{fid}/" in cell:
                    view.setdefault(days[int(d_idx)],[""]*P)
                    view[days[int(d_idx)]][p] = cell + f" (SEC_{sec_id})"
    return jsonify({"status":"ok","faculty_id":fid,"table":view})
if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT","5002")), debug=True)
