import os, json, subprocess
DAY_NAME = ["Mon","Tue","Wed","Thu","Fri"]
CPP_PATH = os.path.join(os.path.dirname(__file__), "..", "bin", "timetable_generator.exe")
if not os.path.exists(CPP_PATH):
    CPP_PATH = os.path.join(os.path.dirname(__file__), "..", "bin", "timetable_generator")
def call_cpp_template(payload: dict) -> dict:
    p = subprocess.run([CPP_PATH], input=json.dumps(payload).encode("utf-8"),
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return json.loads(p.stdout.decode("utf-8"))
def template_match_lookup(template_json: dict):
    want = {}
    for sec in template_json.get("sections", []):
        sname = sec["section"]; table = sec.get("table", {})
        for d, day in enumerate(DAY_NAME):
            for p, subj in enumerate(table.get(day, []) or []):
                subj = (subj or "").strip()
                if subj: want.setdefault((sname, d, p), set()).add(subj)
    return want
