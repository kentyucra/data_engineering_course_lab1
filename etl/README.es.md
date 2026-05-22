# Script ETL Local

`run_etl.py` es el job ETL local para el laboratorio de data engineering Classic Models.

Lee la base de datos MySQL `classicmodels`, crea salidas en esquema estrella similares a las de `glue_job.py` y escribe archivos Parquet.

## Qué Significa ETL

ETL significa **Extract, Transform, Load**.

- **Extract:** leer datos desde un sistema de origen. En este laboratorio, el origen es la base de datos MySQL `classicmodels`.
- **Transform:** remodelar los datos operacionales crudos en una estructura más fácil de analizar. En este laboratorio, el script crea tablas de dimensiones y una tabla de hechos.
- **Load:** escribir los datos transformados en un destino. En este laboratorio, el destino puede ser una carpeta local `warehouse/` o MinIO, que actúa como S3 local.

El flujo es:

```text
MySQL classicmodels -> script ETL -> archivos Parquet en warehouse o MinIO
```

## Dónde Encaja DuckDB

MinIO, al igual que Amazon S3, es almacenamiento de objetos. Guarda archivos, pero no ejecuta consultas SQL por sí mismo.

Después de que el ETL escribe archivos Parquet, se necesita un motor de consulta para leer esos archivos y responder preguntas analíticas. En una configuración cloud administrada, ese motor podría ser **Amazon Athena**. En este laboratorio local, el motor de consulta es **DuckDB**.

El mapeo es:

```text
Cloud: S3 almacena archivos Parquet    -> Athena los consulta
Local: MinIO almacena archivos Parquet -> DuckDB los consulta
```

DuckDB no reemplaza a MySQL. MySQL sigue siendo la base de datos operacional de origen. DuckDB consulta los archivos Parquet analíticos producidos por este job ETL.

Esto da a los estudiantes esta separación:

```text
Datos de app operacional: MySQL
Archivos analíticos de data lake: MinIO
Motor SQL para analytics: DuckDB
```

## Instalación

```bash
cd etl
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Ejecución

Asegúrate de que el contenedor de la base de datos esté corriendo:

```bash
cd ../db
docker-compose up -d --build
```

Ejecuta el ETL:

```bash
cd ../etl
source .venv/bin/activate
python run_etl.py
```

La salida se escribe en:

```text
etl/warehouse/
  dim_customers/dim_customers.parquet
  dim_products/dim_products.parquet
  dim_locations/dim_locations.parquet
  fact_orders/fact_orders.parquet
```

## Ejecutar Una Vez con Docker y Escribir en MinIO

Asegúrate de que la base de datos y MinIO estén corriendo:

```bash
cd ../db
docker-compose up -d --build

cd ../min_io
docker-compose up -d
```

Luego ejecuta el contenedor ETL de una sola corrida:

```bash
cd ../etl
docker-compose up --build
```

El contenedor termina después de que finaliza el ETL. Escribe archivos Parquet en MinIO:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

Abre MinIO para inspeccionar los archivos:

```text
http://localhost:9001
```

Credenciales:

```text
Username: minioadmin
Password: minioadmin
```

El bucket es:

```text
classicmodels
```

## Qué Pasa Si Lo Ejecutas Varias Veces

El job ETL actualmente se comporta como un pipeline de **full refresh**.

Si lo ejecutas muchas veces, escribe en las mismas rutas Parquet:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

Eso significa que la corrida más reciente reemplaza los archivos anteriores en esas rutas de objetos.

No hace lo siguiente:

- duplicar filas dentro de los archivos Parquet
- anexar archivos nuevos
- crear versiones históricas por fecha
- crear una carpeta nueva por cada corrida

Esto es simple y útil para el laboratorio porque los estudiantes pueden volver a ejecutar el job con seguridad y siempre obtener la copia completa más reciente del dataset transformado.

En un pipeline más parecido a producción, podrías escribir en rutas particionadas o fechadas:

```text
s3://classicmodels/warehouse/fact_orders/run_date=2026-05-12/fact_orders.parquet
```

o:

```text
s3://classicmodels/warehouse/fact_orders/year=2026/month=05/day=12/
```

## Conexión Personalizada

```bash
python run_etl.py \
  --host 127.0.0.1 \
  --port 3306 \
  --user admin \
  --password adminpwrd \
  --database classicmodels \
  --target-path warehouse
```

## Escribir en MinIO Sin Docker

```bash
python run_etl.py \
  --host 127.0.0.1 \
  --port 3306 \
  --user admin \
  --password adminpwrd \
  --database classicmodels \
  --target-path s3://classicmodels/warehouse \
  --s3-endpoint http://localhost:9000 \
  --s3-access-key-id minioadmin \
  --s3-secret-access-key minioadmin
```
