# Local MinIO Service

This folder starts a local MinIO service, which acts like a small S3-compatible object store for the lab.

In the AWS version of the lab, transformed data is written to Amazon S3. In the local/server version, MinIO can play that same role.

## How MinIO, Athena, and DuckDB Relate

MinIO is storage. It stores objects such as Parquet files, similar to how Amazon S3 stores files in AWS.

MinIO does not run SQL queries by itself. To query the files, you need a query engine.

In a managed cloud setup:

```text
Amazon S3 stores Parquet files -> Amazon Athena queries them with SQL
```

In this local lab:

```text
MinIO stores Parquet files -> DuckDB queries them with SQL
```

A useful mental model:

```text
S3 / MinIO = where the data files live
Athena / DuckDB = the SQL engine that reads those files
```

So DuckDB acts as the local equivalent of Athena for this lab. Jupyter Lab can use the DuckDB Python library to query Parquet files from MinIO and turn the results into charts or dashboards.

## Start MinIO

```bash
cd min_io
docker-compose up -d
```

If your Docker setup supports the newer Compose plugin, this also works:

```bash
docker compose up -d
```

## Open the Console

Open:

```text
http://localhost:9001
```

Login:

```text
Username: minioadmin
Password: minioadmin
```

The Compose setup creates a bucket named:

```text
classicmodels
```

## S3 Endpoint

Applications should use this local S3 endpoint:

```text
http://localhost:9000
```

Example credentials:

```text
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=classicmodels
```

## Stop MinIO

```bash
docker-compose down
```

## Reset MinIO Data

This deletes the local MinIO volume and recreates an empty bucket.

```bash
docker-compose down -v
docker-compose up -d
```
