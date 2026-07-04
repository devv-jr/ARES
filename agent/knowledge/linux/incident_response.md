# Respuesta a Incidentes en Linux

## Resumen
Guía de comandos esenciales para respuesta a incidentes en Linux. Prioriza recolección de evidencia volátil (memoria, procesos, conexiones de red) antes de apagar el sistema.

## Conceptos clave
- **Orden de volatilidad**: Registrar primero lo más volátil (procesos → conexiones de red → archivos temporales → disco).
- **Chain of Custody**: Documentar cada comando ejecutado y su output para admisibilidad forense.
- **Live Response vs Forense de disco**: Live response recolecta datos del sistema en ejecución; forense trabaja sobre imagen de disco.
- **Zona horaria (TZ)**: Todos los timestamps deben registrarse en UTC para evitar ambigüedad forense.

## Comandos y sintaxis

### Procesos
```bash
# Árbol de procesos (ver hijos de un proceso sospechoso)
ps auxf

# Procesos con conexiones de red abiertas
lsof -i
lsof -i :443

# Procesos escuchando puertos TCP
lsof -iTCP -sTCP:LISTEN

# Procesos ocultos (comparar /proc con ps)
ps aux | awk '{print $2}' | sort > /tmp/ps_pids.txt
ls /proc | grep -E '^[0-9]+$' | sort > /tmp/proc_pids.txt
diff /tmp/ps_pids.txt /tmp/proc_pids.txt

# Procesos sin binario en disco (fileless)
ls -la /proc/*/exe 2>/dev/null | grep '(deleted)'
```

### Conexiones de red (ss recomendado sobre netstat)
```bash
# Todas las conexiones TCP con puertos y procesos
ss -tulpn

# Solo conexiones ESTABLISHED
ss -tunp state established

# Solo puertos LISTEN
ss -tulnp state listening

# Conexiones a IP externa específica
ss -tunp | grep "10.0.0.5"

# Estadísticas - ver puertos específicos
ss -tunp sport = :443 or dport = :443
```
Flags de `ss`:
- `-t` = TCP
- `-u` = UDP
- `-l` = solo Listening
- `-n` = no resuelve nombres
- `-p` = muestra el proceso

### Equivalencia de estados entre herramientas
| Estado real | ss flag | netstat -n | Descripción |
|---|---|---|---|
| Listening | `state listening` | `LISTEN` | Puerto abierto esperando conexiones |
| Established | `state established` | `ESTABLISHED` | Conexión activa entre dos hosts |
| Time Wait | `state time-wait` | `TIME_WAIT` | Socket cerrado, esperando confirmación |
| Close Wait | `state close-wait` | `CLOSE_WAIT` | Remoto cerró, local no ha liberado |

**⚠️ REGLA CRÍTICA**: Para conexiones **ESTABLISHED** usar **`ss -tun state established`**, NUNCA usar la flag **`-l`** que es exclusiva para Listening. `ss -tulpn` solo muestra puertos en escucha, NO conexiones activas establecidas.

### Archivos abiertos y sockets
```bash
# Conexiones de red abiertas por proceso específico
lsof -p <PID> -i

# Archivos abiertos por un proceso (detectar inyección)
lsof -p <PID> | head -50

# Archivos abiertos en /tmp por procesos (común en malware)
lsof -c <nombre> | grep /tmp

# Sockets Unix (comunicación entre procesos)
lsof -U
```

### Logs del sistema
```bash
# Últimos eventos de autenticación
journalctl -u sshd --since "24 hours ago"

# Intentos de login fallidos
journalctl -u sshd --since "24 hours ago" | grep "Failed password"

# Logs de sudo
journalctl -u sudo --since "24 hours ago"

# Logs del kernel (útil para rootkits)
dmesg --level=err,warn

# Archivos de log tradicionales
tail -n 100 /var/log/auth.log
tail -n 100 /var/log/syslog
```

### Integridad del sistema
```bash
# Verificar binarios críticos con hash (comparar con baseline)
sha256sum /bin/ls /bin/ps /bin/ss /usr/bin/lsof

# Buscar archivos modificados en las últimas 24h en /etc
find /etc -type f -mtime -1 -ls

# Procesos ejecutándose desde directorios extraños
ps aux | awk '$11 ~ /^\/tmp/ || $11 ~ /^\/dev\/shm/ || $11 ~ /^\/var\/tmp/'
```

## Ejemplo práctico en terminal

Live response rápida (5 comandos para triage inicial):
```bash
# 1. Hora UTC del sistema (línea base temporal)
date -u +"%Y-%m-%dT%H:%M:%SZ"

# 2. Procesos con uso intensivo de CPU/mem (posible minería)
ps aux --sort=-%cpu | head -20

# 3. Conexiones establecidas hacia IPs externas
ss -tunp state established | grep -v "127.0.0.1" | grep -v "::1"

# 4. Puertos Listening en rangos altos (posible backdoor)
ss -tulnp | awk '$5 ~ /:[1-9][0-9][0-9][0-9][0-9]/'

# 5. Archivos en /tmp con permisos de ejecución
find /tmp -type f -executable -ls | head -20
```

## Escenario real

Un servidor web presenta conexiones salientes a IPs desconocidas:
1. `ss -tunp state established` → varias conexiones a `185.xxx.xxx.50:4444`.
2. `lsof -i @185.xxx.xxx.50` → proceso `/tmp/.cache/update` (fileless o binario no estándar).
3. `ps auxf | grep update` → proceso hijo de nginx (posible inyección de proceso).
4. `ls -la /proc/<PID>/exe` → binario eliminado en disco pero en ejecución (rootkit/fileless).
5. Se aísla el servidor, se captura un memory dump con `li-me` y se escala.

## Detección y mitigación
- Monitorear nuevos procesos escuchando en puertos con auditd (regla `-w /proc/net/tcp -p read`).
- Detección de conexiones salientes a IPs maliciosas vía Zeek/Suricata + blacklists.
- Hardening: usar `ss` en vez de `netstat` (más rápido, parte de iproute2, disponible en contenedores).
- Endpoint Detection: Falco o osquery para monitorear sockets y procesos en tiempo real.
- Regla de iptables/nftables de salida restrictiva por defecto.

## Herramientas relacionadas
- ss, lsof, ps, journalctl, auditd, Falco, osquery, chkrootkit, rkhunter, LiME (memory acquisition), YARA, Volatility.
