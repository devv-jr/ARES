# Linux

## Resumen

Linux es una base operativa para tareas de seguridad ofensiva y defensiva. En ARES esta nota debe servir para entender el sistema, moverse con rapidez en terminal, detectar debilidades y ejecutar tareas repetibles de hardening, recolección de evidencia y administración remota.

## Conceptos clave

- Permisos Unix: `r`, `w`, `x` sobre usuario, grupo y otros.
- Propiedad: usuario dueño y grupo dueño de un archivo o directorio.
- Procesos: cada tarea en ejecución tiene un PID, estado y argumentos.
- Servicios: procesos gestionados por `systemd` en la mayoría de distribuciones modernas.
- Red: interfaces, rutas, puertos escuchando y resolución DNS.
- Privilegios: escalado local, `sudo`, capabilities y cuentas de servicio.

## Comandos y sintaxis

- `ls -lah` para listar archivos con permisos y tamaños legibles.
- `id` para ver usuario, grupos y UID/GID.
- `whoami` para confirmar la identidad actual.
- `chmod 750 archivo` para ajustar permisos.
- `chown usuario:grupo archivo` para cambiar dueño y grupo.
- `ps aux` y `top` para revisar procesos.
- `systemctl status servicio` para ver estado de un servicio.
- `journalctl -u servicio` para revisar logs de un servicio.
- `ip a`, `ip r` y `ss -tulpn` para red y puertos.
- `sudo -l` para enumerar permisos elevados disponibles.

## Ejemplo práctico en terminal

```bash
id
ls -lah /var/www
sudo -l
ss -tulpn
```

Salida esperada, a modo de referencia:

```text
uid=1000(alex) gid=1000(alex) groups=1000(alex),27(sudo)
drwxr-xr-x  2 root root 4096 Jul  3 10:00 /var/www
User alex may run the following commands on this host:
    (root) NOPASSWD: /usr/bin/systemctl restart nginx
LISTEN 0 128 0.0.0.0:22
LISTEN 0 511 127.0.0.1:8080
```

## Escenario real

Un servidor expone un panel interno en `127.0.0.1:8080`, pero el operador encuentra que `sudo -l` permite reiniciar servicios sin contraseña. En un entorno mal configurado, eso puede abrir la puerta a una mala administración de servicios, manipulación de configuración o exposición accidental de aplicaciones internas.

## Detección y mitigación

- Revisar `sudoers` y eliminar reglas amplias o demasiado específicas.
- Auditar archivos con permisos inseguros en rutas sensibles como `/etc`, `/opt` y `/var/www`.
- Vigilar binarios con `SUID` y `SGID` innecesarios.
- Reducir superficie de ataque desactivando servicios que no se usan.
- Aplicar `AppArmor` o `SELinux` cuando el entorno lo permita.
- Centralizar logs con `journalctl`, `rsyslog` o una plataforma SIEM.

## Herramientas relacionadas

- `grep`, `awk`, `sed` para parsing rápido.
- `find`, `xargs` y `tar` para inventario y empaquetado.
- `strace` y `lsof` para inspección de procesos y archivos abiertos.
- `netstat` o `ss` para visibilidad de red.
- `tcpdump` para captura rápida de tráfico.

## Referencias útiles

- Linux man pages.
- GNU Coreutils documentation.
- `sudoers(5)`.
- `systemd` documentation.
