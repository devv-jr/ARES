# Network Forensics en Windows

## Resumen
Análisis de conexiones de red en Windows para detectar actividad maliciosa, C2, exfiltración o scanning. La diferencia entre estados de conexión (Listening vs Established) es fundamental para identificar servidores locales vs conexiones activas remotas.

## Conceptos clave
- **Listening**: El puerto está abierto y a la espera de conexiones entrantes. El sistema acepta conexiones en ese puerto. Indica un servicio corriendo localmente (ej. `0.0.0.0:445` → servicio SMB escuchando).
- **Established**: Conexión activa entre dos hosts. Hay un socket abierto y comunicándose. Indica tráfico en curso (ej. `192.168.1.10:54321 -> 10.0.0.5:443`). Una conexión ESTABLISHED hacia una IP externa en un puerto no estándar es sospechosa.
- **Time_Wait**: La conexión fue cerrada pero el socket sigue reservado por breve tiempo. Normal, pero muchas conexiones TIME_WAIT pueden indicar escaneo.
- **Close_Wait**: El servidor remoto cerró la conexión, pero la app local aún no la libera. Alto volumen puede indicar proceso colgado.
- **Foreign Address**: IP y puerto del otro extremo de la conexión (0.0.0.0 en Listening significa "cualquier interfaz").
- **PID**: Process Identifier asociado a la conexión. Permite correlacionar con el ejecutable que abrió el puerto.

## Comandos y sintaxis

### netstat (clásico)
```cmd
netstat -ano
```
Flags:
- `-a` = todas las conexiones y puertos en escucha
- `-n` = muestra IPs y puertos en formato numérico (no resuelve nombres)
- `-o` = muestra el PID del proceso dueño de cada conexión

Filtrar por estado específico:
```cmd
netstat -ano | findstr ESTABLISHED
netstat -ano | findstr LISTENING
netstat -ano | findstr TIME_WAIT
```
Filtrar por puerto:
```cmd
netstat -ano | findstr :443
netstat -ano | findstr :80
```

### Get-NetTCPConnection (PowerShell moderno, PowerShell 5+)
```powershell
Get-NetTCPConnection
```
Ver conexiones por estado específico:
```powershell
Get-NetTCPConnection -State Established
Get-NetTCPConnection -State Listen      # equivalente a Listening
Get-NetTCPConnection -State TimeWait
Get-NetTCPConnection -State CloseWait
```
Filtrar por puerto remoto:
```powershell
Get-NetTCPConnection -RemotePort 443
Get-NetTCPConnection -RemotePort 80
```
Filtrar por IP remota:
```powershell
Get-NetTCPConnection | Where-Object {$_.RemoteAddress -eq "10.0.0.5"}
```
Ver conexiones sospechosas (puertos efímeros hacia IP externas):
```powershell
Get-NetTCPConnection -State Established | Where-Object {$_.RemotePort -ge 49152 -and $_.RemoteAddress -notlike "192.168.*" -and $_.RemoteAddress -notlike "10.*"}
```

### Diferencia clave entre herramientas
| Herramienta | Listening se muestra como | Established se muestra como |
|---|---|---|
| `netstat -ano` | `LISTENING` | `ESTABLISHED` |
| `Get-NetTCPConnection` | `Listen` | `Established` |
| `ss` (Linux) | `LISTEN` | `ESTAB` |

**Error común**: Usar `netstat -ano | findstr "LISTENING"` vs `Get-NetTCPConnection -State Listening`. En PowerShell, `Listening` no es un valor válido; debe ser `Listen`.

**⚠️ REGLA CRÍTICA — ss en Linux**: Para conexiones **ESTABLISHED** usar **`ss -tun state established`**, NUNCA usar la flag **`-l`** que es exclusiva para Listening. `ss -tulpn` solo muestra Listening, NO conexiones activas.

## Ejemplo práctico en terminal

Detectar C2 (Command & Control) sospechoso:
```powershell
# 1. Enumerar todas las conexiones establecidas
$connections = Get-NetTCPConnection -State Established

# 2. Filtrar conexiones con IPs externas no locales
$suspicious = $connections | Where-Object {
    $_.RemoteAddress -ne "0.0.0.0" -and
    $_.RemoteAddress -notlike "192.168.*" -and
    $_.RemoteAddress -notlike "10.*" -and
    $_.RemoteAddress -notlike "172.16.*" -and
    $_.RemoteAddress -notlike "127.*"
}

# 3. Mostrar resultado con nombre de proceso
$suspicious | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    [PSCustomObject]@{
        Proceso    = $proc.ProcessName
        PID        = $_.OwningProcess
        Local      = "$($_.LocalAddress):$($_.LocalPort)"
        Remoto     = "$($_.RemoteAddress):$($_.RemotePort)"
    }
} | Format-Table
```

## Escenario real

Un analysta de SOC recibe una alerta de conexión saliente desde un endpoint corporativo:
1. Ejecuta `netstat -ano | findstr ESTABLISHED` y ve `192.168.1.15:49872 -> 45.33.32.156:8443`.
2. El puerto remoto 8443 no es estándar. La IP no está en whitelist.
3. Correlaciona con PID: `tasklist /fi "PID eq 49872"` → proceso `svchost.exe` fuera de contexto.
4. Confirma con `Get-NetTCPConnection -State Established | Where-Object {$_.RemoteAddress -eq "45.33.32.156"}`.
5. Aísla el endpoint, captura el tráfico con netsh trace y escala.

## Detección y mitigación
- Monitorear nuevos puertos Listening con Sysmon Event ID 3 (NetworkConnect).
- Event ID 5156 (conexión permitida por firewall) y 5157 (denegada) en Windows Security Log.
- Alertar sobre procesos no firmados abriendo puertos Listening en rangos altos (>1024).
- Regla de firewall de salida por defecto: denegar, solo permitir IPs/puertos whitelisteados.
- Correlacionar conexiones ESTABLISHED con procesos legítimos conocidos.

## Herramientas relacionadas
- Sysmon, netstat, PowerShell (Get-NetTCPConnection), TCPView (Sysinternals), Wireshark, Zeek, netsh trace.
