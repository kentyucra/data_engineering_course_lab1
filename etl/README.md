# Local ETL Script

`run_etl.py` is the local ETL job for the Classic Models data engineering lab.

It reads the `classicmodels` MySQL database, creates the same star-schema outputs as `glue_job.py`, and writes Parquet files.

## What ETL Means

ETL means **Extract, Transform, Load**.

- **Extract:** read data from a source system. In this lab, the source is the MySQL `classicmodels` database.
- **Transform:** reshape the raw operational data into a structure that is easier to analyze. In this lab, the script creates dimension tables and a fact table.
- **Load:** write the transformed data into a destination. In this lab, the destination can be a local `warehouse/` folder or MinIO, which acts like local S3.

The flow is:

```text
MySQL classicmodels -> ETL script -> Parquet files in warehouse or MinIO
```

## Where DuckDB Fits

MinIO, like Amazon S3, is object storage. It stores files, but it does not run SQL queries by itself.

After the ETL writes Parquet files, a query engine is needed to read those files and answer analytical questions. In a managed cloud setup, that query engine might be **Amazon Athena**. In this local lab, the query engine is **DuckDB**.

The mapping is:

```text
Cloud: S3 stores Parquet files    -> Athena queries them
Local: MinIO stores Parquet files -> DuckDB queries them
```

DuckDB is not replacing MySQL. MySQL is still the operational source database. DuckDB queries the transformed analytical Parquet files produced by this ETL job.

That gives students this separation:

```text
Operational app data: MySQL
Analytical data lake files: MinIO
SQL query engine for analytics: DuckDB
```

## Install

```bash
cd etl
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

Make sure the database container is running:

```bash
cd ../db
docker-compose up -d --build
```

Run the ETL:

```bash
cd ../etl
source .venv/bin/activate
python run_etl.py
```

The output is written to:

```text
etl/warehouse/
  dim_customers/dim_customers.parquet
  dim_products/dim_products.parquet
  dim_locations/dim_locations.parquet
  fact_orders/fact_orders.parquet
```

## Run Once with Docker and Write to MinIO

Make sure both the database and MinIO are running:

```bash
cd ../db
docker-compose up -d --build

cd ../min_io
docker-compose up -d
```

Then run the one-shot ETL container:

```bash
cd ../etl
docker-compose up --build
```

The container exits after the ETL finishes. It writes Parquet files to MinIO:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

Open MinIO to inspect the files:

```text
http://localhost:9001
```

Credentials:

```text
Username: minioadmin
Password: minioadmin
```

The bucket is:

```text
classicmodels
```

## What Happens If You Run It Multiple Times?

The ETL job currently behaves like a **full refresh** pipeline.

If you run it many times, it writes to the same Parquet paths:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

That means the latest run replaces the previous files at those object paths.

It does not:

- duplicate rows inside the Parquet files
- append new files
- create historical versions by date
- create a new folder for every run

This is simple and useful for the lab because students can rerun the job safely and always get the latest full copy of the transformed dataset.

In a more production-like pipeline, you might write to partitioned or dated paths instead:

```text
s3://classicmodels/warehouse/fact_orders/run_date=2026-05-12/fact_orders.parquet
```

or:

```text
s3://classicmodels/warehouse/fact_orders/year=2026/month=05/day=12/
```

## Custom Connection

```bash
python run_etl.py \
  --host 127.0.0.1 \
  --port 3306 \
  --user admin \
  --password adminpwrd \
  --database classicmodels \
  --target-path warehouse
```

## Write to MinIO Without Docker

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
