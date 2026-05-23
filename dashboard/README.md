# Local Dashboard with DuckDB

This folder contains the local analytics dashboard notebook for the Classic Models data engineering lab.

A managed cloud analytics setup often uses:

```text
Amazon S3 -> Amazon Athena -> Jupyter
```

This local/server lab uses:

```text
MinIO -> DuckDB -> Jupyter
```

MinIO stores the Parquet files created by the ETL job. DuckDB is the local SQL query engine that reads those Parquet files and returns DataFrames for charts.

## Prerequisites

Start the database, MinIO, and run the ETL:

```bash
cd ../db
docker-compose up -d --build

cd ../min_io
docker-compose up -d

cd ../etl
docker-compose up --build
```

After the ETL runs, MinIO should contain:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

## Run Jupyter with Docker

```bash
cd ../dashboard
docker-compose up -d --build
```

Open:

```text
http://localhost:8888/lab?token=classicmodels
```

Open the notebook:

```text
classicmodels_dashboard_duckdb.ipynb
```

The notebook includes the schema image:

```text
schema_after_etl.png
```

Class report ideas and group assignments are available in:

```text
../docs/dashboard-report-assignments.md
```

## Run Locally Without Docker

```bash
cd dashboard
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter lab
```

If running locally, the notebook uses:

```text
S3_ENDPOINT=localhost:9000
```

If running inside the Docker Compose Jupyter container, the notebook uses:

```text
S3_ENDPOINT=classicmodels-minio:9000
```

The Docker Compose file sets that value automatically.
