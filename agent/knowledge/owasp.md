# OWASP

## Resumen

OWASP agrupa riesgos y buenas prácticas para aplicaciones web y APIs. Para ARES, esta nota debe funcionar como referencia base para reconocer fallas frecuentes, priorizar hallazgos y conectar cada problema con una mitigación clara.

## Conceptos clave

- Broken Access Control.
- Cryptographic Failures.
- Injection.
- Insecure Design.
- Security Misconfiguration.
- Vulnerable and Outdated Components.
- Identification and Authentication Failures.
- Software and Data Integrity Failures.
- Security Logging and Monitoring Failures.
- Server-Side Request Forgery (SSRF).

## Comandos y sintaxis

- `curl -I https://target` para revisar headers y superficie visible.
- `nuclei -u https://target -tags exposure,misconfig` para validación rápida en entornos autorizados.
- `owasp-zap` para inspección manual y automatizada de aplicaciones web.

## Ejemplo práctico en terminal

```bash
curl -I https://example.com
```

Salida esperada, a modo de referencia:

```text
HTTP/2 200
content-security-policy: default-src 'self'
strict-transport-security: max-age=31536000
x-frame-options: DENY
```

## Escenario real

Una aplicación expone un endpoint con control de acceso débil. Un usuario autenticado puede consultar recursos de otros usuarios si modifica un identificador. La prioridad en defensa es validar autorización por objeto, no solo por sesión.

## Detección y mitigación

- Revisar autorización en cada request y no confiar en el frontend.
- Parametrizar consultas y evitar concatenación de entradas.
- Aplicar CSP, HSTS y headers de seguridad cuando corresponda.
- Mantener dependencias actualizadas y rastrear CVE relevantes.
- Registrar eventos de autenticación, autorización y errores sensibles.

## Herramientas relacionadas

- OWASP ZAP.
- Nuclei.
- Semgrep.
- Burp Suite.

## Referencias útiles

- OWASP Top 10.
- OWASP Cheat Sheet Series.
- CWE and CVE references.
