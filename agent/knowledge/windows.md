# Windows

## Resumen

Windows sigue siendo una superficie central para defensa corporativa, análisis forense y ataques de post-explotación en entornos de laboratorio autorizados. Esta nota debe cubrir administración, telemetría y señales útiles para detectar abuso de privilegios o movimiento lateral.

## Conceptos clave

- UAC y privilegios elevados.
- Servicios y tareas programadas.
- Registro de eventos y logging centralizado.
- PowerShell como capa de administración y automatización.
- Tokens, SID, grupos locales y dominio.
- Defender, firewall y políticas de seguridad.

## Comandos y sintaxis

- `whoami /all` para ver privilegios y grupos efectivos.
- `net user` y `net localgroup` para enumeración básica.
- `sc query` para listar servicios.
- `tasklist` para procesos activos.
- `Get-Process` y `Get-Service` en PowerShell.
- `Get-WinEvent` para consultar eventos.
- `wevtutil` para operar con logs del sistema.
- `ipconfig /all` para configuración de red.

## Ejemplo práctico en terminal

```powershell
whoami /all
Get-Service | Select-Object -First 5
Get-WinEvent -LogName Security -MaxEvents 3
```

Salida esperada, a modo de referencia:

```text
User Name: DESKTOP\alex
Privilege Name            Description
=========================
SeChangeNotifyPrivilege   Bypass traverse checking
SeShutdownPrivilege       Shut down the system

Status   Name               DisplayName
------   ----               -----------
Running  WinDefend          Microsoft Defender Antivirus Service
Running  EventLog           Windows Event Log
```

## Escenario real

En una estación un usuario estándar abre un archivo adjunto que dispara actividad sospechosa en PowerShell. El equipo de defensa debe correlacionar procesos, eventos de seguridad y conexiones de red para distinguir automatización legítima de ejecución no autorizada.

## Detección y mitigación

- Habilitar auditoría relevante en Security, PowerShell y Script Block Logging.
- Restringir PowerShell donde el negocio lo permita.
- Aplicar least privilege en usuarios y grupos locales.
- Vigilar creación de servicios, tareas programadas y uso de `runas`.
- Usar Microsoft Defender y reglas ASR cuando estén disponibles.
- Revisar cuentas con privilegios de administrador local y dominio.

## Herramientas relacionadas

- PowerShell.
- Sysinternals Suite.
- Windows Event Viewer.
- Defender for Endpoint.
- Sysmon.

## Referencias útiles

- Microsoft Learn.
- Sysinternals documentation.
- Windows security auditing guide.
