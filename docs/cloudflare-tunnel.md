# Expose Local Lab Services with Cloudflare Tunnel

This guide documents how to expose a local Docker service, such as Jupyter or the frontend, through a Cloudflare Tunnel.

Cloudflare Tunnel lets you publish a local service without opening router ports. `cloudflared` runs on your machine, creates an outbound connection to Cloudflare, and Cloudflare routes a public hostname to your local service.

## Example Goal

Expose a local service like this:

```text
Local service: http://localhost:8888
Public URL:    https://data-engineering-lab1.yourdomain.com
```

For this lab, common local ports are:

| Service | Local URL | Suggested public hostname |
| --- | --- | --- |
| Jupyter dashboard | `http://localhost:8888` | `dashboard.yourdomain.com` |
| Frontend app | `http://localhost:3000` | `app.yourdomain.com` |
| MinIO console | `http://localhost:9001` | `minio.yourdomain.com` |

Be careful exposing Jupyter or MinIO publicly. For a class or public internet access, protect these hostnames with Cloudflare Access or another authentication layer.

## 1. Log In to Cloudflare

Run:

```bash
cloudflared tunnel login
```

This opens a browser window where you choose the Cloudflare account and domain.

After login succeeds, `cloudflared` saves an origin certificate here:

```text
~/.cloudflared/cert.pem
```

## 2. Create a Named Tunnel

Create a tunnel:

```bash
cloudflared tunnel create my-tunnel
```

The output will include a tunnel ID and a credentials file:

```text
Created tunnel my-tunnel with id TUNNEL_ID
Tunnel credentials written to ~/.cloudflared/TUNNEL_ID.json
```

Example format:

```text
Created tunnel my-tunnel with id 00000000-0000-0000-0000-000000000000
```

Keep the JSON credentials file secret. Do not commit it to Git.

## 3. Create the Tunnel Config File

Create or edit:

```bash
vim ~/.cloudflared/config.yml
```

Example config for exposing Jupyter:

```yaml
tunnel: my-tunnel
credentials-file: /Users/youruser/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: data-engineering-lab1.yourdomain.com
    service: http://localhost:8888

  - service: http_status:404
```

Important:

- `tunnel` must match the tunnel name you created.
- `credentials-file` must point to the real JSON file created by `cloudflared tunnel create`.
- `hostname` must match the public hostname you route in Cloudflare DNS.
- The final `http_status:404` rule is the fallback for unmatched hostnames.

In your terminal session, the first run failed because the config used:

```text
/Users/youruser/.cloudflared/...
```

but the real path should use your actual local username:

```text
/Users/YOUR_USER/.cloudflared/...
```

When this path is wrong, `cloudflared tunnel run` prints:

```text
Tunnel credentials file '...' doesn't exist or is not a file
```

Fix the path and run the tunnel again.

## 4. Route a DNS Hostname to the Tunnel

Create the Cloudflare DNS route:

```bash
cloudflared tunnel route dns my-tunnel data-engineering-lab1.yourdomain.com
```

Example output:

```text
Added CNAME data-engineering-lab1.yourdomain.com which will route to this tunnel
```

The hostname in this command should be the same hostname in `~/.cloudflared/config.yml`.

Prefer hyphens in public hostnames:

```text
data-engineering-lab1.yourdomain.com
```

rather than underscores:

```text
data_engineering_lab1.yourdomain.com
```

## 5. Run the Tunnel

Make sure the local service is already running.

For Jupyter:

```bash
cd dashboard
docker-compose up -d --build
```

Then run:

```bash
cloudflared tunnel run my-tunnel
```

Successful output includes messages like:

```text
Starting tunnel tunnelID=...
Registered tunnel connection ... protocol=quic
```

Now open:

```text
https://data-engineering-lab1.yourdomain.com
```

## 6. Add More Subdomains and Services

You can reuse the same tunnel for multiple local services by adding more `ingress` rules.

Example:

```yaml
tunnel: my-tunnel
credentials-file: /Users/youruser/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: dashboard.yourdomain.com
    service: http://localhost:8888

  - hostname: app.yourdomain.com
    service: http://localhost:3000

  - hostname: minio.yourdomain.com
    service: http://localhost:9001

  - service: http_status:404
```

Then create one DNS route per hostname:

```bash
cloudflared tunnel route dns my-tunnel dashboard.yourdomain.com
cloudflared tunnel route dns my-tunnel app.yourdomain.com
cloudflared tunnel route dns my-tunnel minio.yourdomain.com
```

Restart the tunnel after changing `config.yml`:

```bash
cloudflared tunnel run my-tunnel
```

## 7. Troubleshooting

### Credentials File Does Not Exist

Error:

```text
Tunnel credentials file '/Users/youruser/.cloudflared/TUNNEL_ID.json' doesn't exist or is not a file
```

Fix:

```bash
ls ~/.cloudflared
cat ~/.cloudflared/config.yml
```

Update `credentials-file` with the real path to the JSON file.

### Hostname Does Not Route

Check that the DNS route exists:

```bash
cloudflared tunnel route dns my-tunnel data-engineering-lab1.yourdomain.com
```

Also confirm the hostname in `config.yml` exactly matches the hostname you routed.

### Local Service Is Not Running

Cloudflare can reach your machine only if `cloudflared` is running, but `cloudflared` can reach your app only if the local service is running.

Check local service ports:

```bash
docker ps
```

Open locally first:

```text
http://localhost:8888
http://localhost:3000
http://localhost:9001
```

### QUIC or DNS Timeout Warnings

You may see logs like:

```text
Failed to refresh DNS local resolver
failed to accept QUIC stream: timeout: no recent network activity
Retrying connection
```

These can happen during temporary network issues. If the tunnel later logs `Registered tunnel connection`, it recovered.

If the tunnel is unstable for a long time:

```bash
cloudflared tunnel run --protocol http2 my-tunnel
```

This uses HTTP/2 instead of QUIC and can be more reliable on some networks.

### Stop the Tunnel

If running in the foreground, press:

```text
Ctrl+C
```

Shutdown logs after `Ctrl+C` are expected.

## 8. Quick Template

Use this as a reusable template:

```bash
cloudflared tunnel login
cloudflared tunnel create TUNNEL_NAME
vim ~/.cloudflared/config.yml
cloudflared tunnel route dns TUNNEL_NAME SUBDOMAIN.yourdomain.com
cloudflared tunnel run TUNNEL_NAME
```

Config template:

```yaml
tunnel: TUNNEL_NAME
credentials-file: /Users/YOUR_USER/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: SUBDOMAIN.yourdomain.com
    service: http://localhost:LOCAL_PORT

  - service: http_status:404
```
