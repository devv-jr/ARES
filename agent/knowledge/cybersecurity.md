# Vulnerabilidades Web

## Cross-Site Scripting (XSS)
XSS permite inyectar scripts maliciosos en páginas web vistas por otros usuarios. Tipos: Reflejado (el payload viaja en la request), Almacenado (persiste en el servidor) y DOM-based (se ejecuta en el lado del cliente sin enviarse al servidor). Mitigación: escapar salida según contexto (HTML entity, JavaScript, CSS), usar Content Security Policy (CSP), validar y sanitizar entradas del lado del servidor, evitar innerHTML y métodos peligrosos del DOM.

## SQL Injection (SQLi)
Ocurre cuando datos no confiables se concatenan en consultas SQL. Permite al atacante leer, modificar o eliminar datos, e incluso ejecutar comandos en el servidor. Mitigación: usar consultas parametrizadas (prepared statements), ORM con binding automático, validar tipos de datos, aplicar privilegios mínimos en la base de datos, evitar procedimientos almacenados dinámicos.

## Cross-Site Request Forgery (CSRF)
Obliga a un usuario autenticado a ejecutar acciones no deseadas en una aplicación web donde está logueado. Mitigación: tokens CSRF únicos por sesión, SameSite cookies en Strict o Lax, validar origen mediante headers Origin/Referer, doble sumisión de cookies.

## Insecure Direct Object References (IDOR)
Ocurre cuando una aplicación expone referencias internas a objetos (IDs, rutas) permitiendo que un atacante acceda a recursos no autorizados. Mitigación: validar permisos de acceso en cada request, usar identificadores opacos no secuenciales (UUIDs), implementar pruebas de autorización por recurso.

## Security Misconfiguration
Incluye puertos abiertos innecesarios, headers de seguridad faltantes, directorios listables, cuentas por defecto, mensajes de error detallados. Mitigación: hardening por capas, revisión periódica de configuraciones, eliminar servicios innecesarios, aplicar reglas de firewall, usar herramientas de escaneo como OWASP ZAP o Nuclei.

# Autenticación y Manejo de Sesiones

## Almacenamiento Seguro de Credenciales
Usar algoritmos de hash lentos y con sal (bcrypt, argon2, scrypt). Nunca almacenar contraseñas en texto plano. Implementar políticas de rotación, multifactor authentication (MFA), bloqueo por intentos fallidos y notificaciones de acceso sospechoso.

## Manejo de Tokens y API Keys
Tokens JWT deben firmarse con algoritmos seguros (HS256 o RS256), tener expiración corta, transportarse por canales seguros (HTTPS) y almacenarse de forma segura (httpOnly cookies para web, Keychain/Keystore para móviles). API Keys deben ser rotables, tener scope limitado y nunca exponerse en repositorios públicos, logs o frontend.

## Session Management
Las sesiones deben usar identificadores aleatorios criptográficamente seguros, expirar después de inactividad, renovarse tras autenticación (session fixation), y destruirse al cerrar sesión. Usar Secure y httpOnly flags en cookies de sesión.

# Seguridad en Red

## Análisis de Tráfico y Monitoreo
Implementar detección de anomalías mediante análisis de logs, monitoreo de puertos y tráfico sospechoso. Herramientas: Wireshark para captura de paquetes, Zeek (Bro) para análisis de red, Suricata para IDS/IPS. El principio zero trust asume que la red ya está comprometida y verifica todo.

## Firewall y Segmentación
Aplicar reglas de firewall basadas en el principio de mínimo privilegio. Segmentar la red en zonas (DMZ, interna, administración) con controles de acceso entre ellas. Usar VLANs y microsegmentación para contener incidentes.

# Prácticas de Desarrollo Seguro

## OWASP Top 10
Las categorías principales: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable and Outdated Components, Identification and Authentication Failures, Software and Data Integrity Failures, Security Logging and Monitoring Failures, Server-Side Request Forgery (SSRF).

## Secure Coding
Validar entradas tempranamente (allowlist sobre denylist), sanitizar salidas según contexto, usar prepared statements contra inyección, aplicar principio de mínimo privilegio en cuentas de servicio, mantener dependencias actualizadas, firmar artefactos y verificar integridad, registrar eventos de seguridad con contexto suficiente para auditoría.

## Shift Left Security
Integrar seguridad en etapas tempranas del SDLC: threat modeling en diseño, análisis estático (SAST) en commit, análisis de dependencias (SCA) en build, análisis dinámico (DAST) en staging. Herramientas: Semgrep, SonarQube, Snyk, OWASP Dependency Check.
