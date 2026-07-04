# Hacking Tools

## Resumen

Esta nota agrupa herramientas conocidas que ARES puede reconocer, clasificar y contextualizar. El objetivo no es enseñar abuso paso a paso, sino entender para qué sirve cada herramienta, qué señales deja y cuándo conviene usarla en labores autorizadas de evaluación o defensa.

## Conceptos clave

- Herramientas de reconocimiento.
- Escáneres de vulnerabilidades.
- Proxy y análisis web.
- Fuerza bruta y validación de credenciales.
- Análisis de tráfico y logs.
- Post-explotación y administración remota.

## Comandos y sintaxis

- `nmap -sV target` para identificar servicios y versiones.
- `nmap -O target` para intentar fingerprinting de sistema operativo.
- `curl -I https://example.com` para revisar headers HTTP.
- `git clone <repo>` para instalar herramientas desde GitHub.
- `python tool.py -h` para revisar ayuda de utilidades escritas en Python.

## Ejemplo práctico en terminal

```bash
nmap -sV 192.168.1.10
curl -I https://example.com
```

Salida esperada, a modo de referencia:

```text
22/tcp open  ssh     OpenSSH 8.9
80/tcp open  http    Apache httpd 2.4.52
HTTP/2 200
server: nginx
content-type: text/html
```

## Escenario real

En una evaluación interna, un equipo valida la exposición de un servicio web, confirma versiones y cruza esa información con CVE conocidos para decidir si hay una ventana de riesgo real. En defensa, el mismo flujo se usa para inventario, hardening y validación de superficie expuesta.

## Detección y mitigación

- Monitorear barridos de puertos y abuso de login con alertas por tasa anómala.
- Registrar User-Agent, IP, rutas y códigos de respuesta en servicios web.
- Bloquear herramientas no autorizadas en endpoints sensibles.
- Segmentar redes y limitar exposición de administración remota.
- Correlacionar eventos de herramientas con IOC e inteligencia de amenazas.

## Herramientas relacionadas

- `nmap`.
- `wireshark`.
- `burp suite`.
- `hydra`.
- `john the ripper`.
- `sqlmap`.
- `ffuf`.
- `gobuster`.
- `metasploit`.
- `volatility`.
- `yara`.

## Referencias útiles

- GitHub repositories oficiales de cada herramienta.
- CVE Mitre.
- OWASP Tooling and Cheat Sheet resources.
