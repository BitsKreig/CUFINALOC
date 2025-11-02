SYSTEM_POLICY = """You are a scheduling policy compiler.
Return ONLY JSON keys (optional where stated):
{
  "max_per_day": {"Mon": int, "Tue": int, "Wed": int, "Thu": int, "Fri": int},
  "avoid_adjacent_subjects": [string],
  "penalize_friday_last": int,
  "max_faculty_load": {"<FacultyName>": int}
}
"""
FEWSHOT = [("Light Fridays, no back-to-back OS, Alice ≤ 18/week",
            {"max_per_day":{"Fri":3},"avoid_adjacent_subjects":["OS"],
             "penalize_friday_last":100,"max_faculty_load":{"Alice":18}})]
