from .ollama_router import chat_json
from .prompts import SYSTEM_POLICY, FEWSHOT
import json
def compile_policy_from_prompt(prompt_text: str) -> dict:
    examples = "\n\n".join([f"Request: {a}\nJSON: {json.dumps(b)}" for a,b in FEWSHOT])
    user = prompt_text.strip() + "\n\n" + examples + "\n\nReturn JSON only."
    return chat_json(SYSTEM_POLICY, user)
