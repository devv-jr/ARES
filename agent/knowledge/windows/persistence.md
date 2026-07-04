# Persistencia en Windows

## Resumen
Mecanismos que usa malware y atacantes para mantener acceso tras un reinicio o cierre de sesión en Windows. La detección temprana de persistencia es crítica en forense y respuesta a incidentes.

## Conceptos clave
- **Run Keys**: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` y `HKLM\...\Run` ejecutan binarios al inicio de sesión.
- **Scheduled Tasks**: `schtasks.exe` o `Register-ScheduledTask` (Task Scheduler). Comunes para ejecución periódica o ante eventos específicos.
- **Servicios (Services)**: `sc.exe create` o `New-Service`. Se inician automáticamente con SYSTEM.
- **WMI Event Subscription**: `__EventFilter` + `CommandLineEventConsumer` — persistencia sin archivo en disco (fileless).
- **Startup Folder**: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`.
- **DLL Hijacking / Side-Loading**: Sustitución de DLLs que una aplicación legítima carga sin ruta absoluta.
- **Bootkit / Driver Load**: Carga de drivers maliciosos vía `sc.exe` o `fltmc.exe`.
- **COM Hijacking**: Modificación de CLSID en registro para ejecutar código arbitrario cuando una app legítima invoca un objeto COM.

## Comandos y sintaxis

### Run Keys (Registro)
```powershell
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Run"
```

### Scheduled Tasks
```cmd
schtasks /query /fo LIST /v
```
PowerShell:
```powershell
Get-ScheduledTask | Where-Object {$_.State -ne "Disabled"} | Format-Table TaskName,State
Get-ScheduledTask | Get-ScheduledTaskInfo | Format-Table TaskName,LastRunTime,LastTaskResult
```

### Servicios
```cmd
sc query type= service state= all
wmic service get name,displayname,pathname,startmode
```
PowerShell:
```powershell
Get-WmiObject -Class Win32_Service | Select-Object Name,PathName,StartMode
```

### WMI Event Subscription (fileless)
```powershell
Get-WmiObject -Namespace root\subscription -Class __EventFilter
Get-WmiObject -Namespace root\subscription -Class CommandLineEventConsumer
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding
```

### Startup Folder
```cmd
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
dir "%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
```

### DLL Hijacking
```powershell
# Buscar procesos cargando DLLs desde directorios modificables
tasklist /m
# Herramienta recomendada: Process Monitor (Procmon) filtrando por .dll
```

## Ejemplo práctico en terminal

Enumerar persistencia sospechosa rápidamente en un endpoint comprometido:
```powershell
Write-Host "=== Run Keys ==="
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run /s
reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run /s

Write-Host "=== Scheduled Tasks recién creadas (últimas 24h) ==="
$threshold = (Get-Date).AddHours(-24)
Get-ScheduledTask | Get-ScheduledTaskInfo | Where-Object {$_.LastRunTime -gt $threshold} | Format-Table TaskName,LastRunTime

Write-Host "=== Servicios no estándar (Inicio automático) ==="
Get-CimInstance -ClassName Win32_Service -Filter "StartMode='Auto' AND PathName NOT LIKE '%\\Windows\\%'" | Select-Object Name,PathName
```

## Escenario real

Un atacante utiliza WMI para persistencia fileless:
1. Crea un `__EventFilter` que se activa cada 60 minutos.
2. Lo enlaza a un `CommandLineEventConsumer` que ejecuta un payload PowerShell encoded.
3. No hay archivos en disco — la persistencia vive solo en el repositorio WMI.
4. Forense: `Get-WmiObject -Namespace root\subscription -Class __EventFilter` revela el filtro.

## Detección y mitigación
- **Sysmon Event ID 13** (RegistryEvent — Run Key modificado) y **Event ID 1** (procesos iniciados desde Run Keys).
- **Event ID 4698** (Scheduled Task creada) y **Event ID 4699** (eliminada).
- **Event ID 7045** (servicio nuevo instalado) en System log.
- Monitorear WMI Activity (Event ID 5861 para __FilterToConsumerBinding).
- Deshabilitar WMI si no se usa en endpoints. Auditar `reg.exe add` a Run Keys con AppLocker o WDAC.

## Herramientas relacionadas
- Sysinternals Autoruns, Sysmon, Procmon, PowerShell, WMI Explorer, KAPE.
