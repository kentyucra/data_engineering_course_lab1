# Servicio Local MinIO

Esta carpeta inicia un servicio local de MinIO, que actúa como un pequeño object store compatible con S3 para el laboratorio.

En una versión AWS del laboratorio, los datos transformados se escriben en Amazon S3. En la versión local/servidor, MinIO puede cumplir ese mismo rol.

## Cómo se Relacionan MinIO, Athena y DuckDB

MinIO es almacenamiento. Guarda objetos como archivos Parquet, de forma similar a como Amazon S3 almacena archivos en AWS.

MinIO no ejecuta consultas SQL por sí mismo. Para consultar los archivos, necesitas un motor de consulta.

En una configuración cloud administrada:

```text
Amazon S3 almacena archivos Parquet -> Amazon Athena los consulta con SQL
```

En este laboratorio local:

```text
MinIO almacena archivos Parquet -> DuckDB los consulta con SQL
```

Un modelo mental útil:

```text
S3 / MinIO = donde viven los archivos de datos
Athena / DuckDB = el motor SQL que lee esos archivos
```

Entonces DuckDB actúa como el equivalente local de Athena para este laboratorio. Jupyter Lab puede usar la librería de DuckDB para Python para consultar archivos Parquet desde MinIO y convertir los resultados en gráficos o dashboards.

## Iniciar MinIO

```bash
cd min_io
docker-compose up -d
```

Si tu configuración de Docker soporta el plugin nuevo de Compose, esto también funciona:

```bash
docker compose up -d
```

## Abrir la Consola

Abrir:

```text
http://localhost:9001
```

Login:

```text
Username: minioadmin
Password: minioadmin
```

La configuración Compose crea un bucket llamado:

```text
classicmodels
```

## Endpoint S3

Las aplicaciones deben usar este endpoint S3 local:

```text
http://localhost:9000
```

Credenciales de ejemplo:

```text
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=classicmodels
```

## Detener MinIO

```bash
docker-compose down
```

## Reiniciar los Datos de MinIO

Esto elimina el volumen local de MinIO y recrea un bucket vacío.

```bash
docker-compose down -v
docker-compose up -d
```
