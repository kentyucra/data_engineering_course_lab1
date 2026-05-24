# CloudBeaver

CloudBeaver is a browser-based database client for exploring the Classic Models MySQL database.

## Start CloudBeaver

From this directory:

```bash
docker-compose up -d
```

Open:

```text
http://localhost:8978
```

or from another device on the local network:

```text
http://macmini:8978
```

## Classic Models Connection

Use these values when creating the MySQL connection in CloudBeaver:

```text
Driver: MySQL
Host: host.docker.internal
Port: 3306
Database: classicmodels
Username: classicmodels
Password: ClassicModelsLab1
```

## Cloudflare Tunnel

If exposing CloudBeaver through Cloudflare Tunnel, add an ingress rule like this before the final `http_status:404` rule:

```yaml
  - hostname: cloudbeaver.fratellidevs.com
    service: http://localhost:8978
```

Then restart the tunnel:

```bash
sudo launchctl kickstart -k system/com.cloudflare.cloudflared
```

Protect the CloudBeaver hostname with Cloudflare Access so only approved users can reach the database UI.
