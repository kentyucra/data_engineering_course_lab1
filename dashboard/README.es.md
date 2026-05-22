# Dashboard Local con DuckDB

Esta carpeta contiene el notebook local de dashboard analítico para el laboratorio de data engineering Classic Models.

Una configuración analítica cloud administrada a menudo usa:

```text
Amazon S3 -> Amazon Athena -> Jupyter
```

Este laboratorio local/servidor usa:

```text
MinIO -> DuckDB -> Jupyter
```

MinIO almacena los archivos Parquet creados por el job ETL. DuckDB es el motor SQL local que lee esos archivos Parquet y devuelve DataFrames para gráficos.

## Prerrequisitos

Inicia la base de datos, MinIO y ejecuta el ETL:

```bash
cd ../db
docker-compose up -d --build

cd ../min_io
docker-compose up -d

cd ../etl
docker-compose up --build
```

Después de ejecutar el ETL, MinIO debería contener:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

## Ejecutar Jupyter con Docker

```bash
cd ../dashboard
docker-compose up -d --build
```

Abrir:

```text
http://localhost:8888/lab?token=classicmodels
```

Abre el notebook:

```text
classicmodels_dashboard_duckdb.ipynb
```

El notebook incluye la imagen del esquema:

```text
schema_after_etl.png
```

## Ejecutar Localmente Sin Docker

```bash
cd dashboard
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

Si se ejecuta localmente, el notebook usa:

```text
S3_ENDPOINT=localhost:9000
```

Si se ejecuta dentro del contenedor Jupyter de Docker Compose, el notebook usa:

```text
S3_ENDPOINT=classicmodels-minio:9000
```

El archivo Docker Compose configura ese valor automáticamente.
