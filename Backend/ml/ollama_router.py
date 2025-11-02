import os, requests, json
OLLAMA_URL = os.getenv("OLLAMA_URL","http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL","llama3.1")
def chat_json(system_prompt: str, user_text: str):
    payload = {"model": OLLAMA_MODEL,
               "messages":[{"role":"system","content":system_prompt},
                           {"role":"user","content":user_text}],
               "options":{"temperature":0.2}}
    r = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=60); r.raise_for_status()
    content = r.json()["message"]["content"]
    start, end = content.find("{"), content.rfind("}")
    txt = content[start:end+1] if start!=-1 and end!=-1 else content
    return json.loads(txt)
