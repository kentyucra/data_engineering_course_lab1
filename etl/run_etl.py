#!/usr/bin/env python3
"""Local ETL job for the Classic Models data engineering lab.

This script keeps the same logical pipeline you would build in a managed ETL
service, but runs from a normal Python environment:

    MySQL classicmodels -> star-schema tables -> Parquet files

By default it connects to the local Docker MySQL database and writes to
`./warehouse`.
"""

from __future__ import annotations

import argparse
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import boto3
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


DEFAULT_MYSQL_HOST = "127.0.0.1"
DEFAULT_MYSQL_PORT = 3306
DEFAULT_MYSQL_USER = "admin"
DEFAULT_MYSQL_PASSWORD = "adminpwrd"
DEFAULT_MYSQL_DATABASE = "classicmodels"
DEFAULT_TARGET_PATH = "warehouse"
DEFAULT_S3_ENDPOINT = "http://localhost:9000"
DEFAULT_S3_ACCESS_KEY_ID = "minioadmin"
DEFAULT_S3_SECRET_ACCESS_KEY = "minioadmin"
DEFAULT_S3_REGION = "us-east-1"


TABLE_QUERIES = {
    "dim_customers": """
        SELECT
            customerNumber,
            customerName,
            contactLastName,
            contactFirstName,
            phone,
            addressLine1,
            addressLine2,
            creditLimit
        FROM customers
    """,
    "dim_products": """
        SELECT
            p.productCode,
            p.productName,
            p.productLine,
            p.productScale,
            p.productVendor,
            p.productDescription,
            pl.textDescription AS productLineDescription
        FROM products p
        LEFT JOIN productlines pl
            ON p.productLine = pl.productLine
    """,
    "dim_locations": """
        SELECT DISTINCT
            postalCode,
            city,
            state,
            country
        FROM customers
    """,
    "fact_orders": """
        SELECT
            od.orderLineNumber,
            o.orderNumber,
            o.customerNumber,
            c.postalCode,
            od.productCode,
            o.orderDate,
            o.requiredDate,
            o.shippedDate,
            o.status,
            o.comments,
            od.quantityOrdered,
            od.priceEach,
            od.quantityOrdered * od.priceEach AS orderAmount,
            p.buyPrice,
            p.MSRP
        FROM orders o
        LEFT JOIN orderdetails od
            ON o.orderNumber = od.orderNumber
        LEFT JOIN products p
            ON od.productCode = p.productCode
        LEFT JOIN customers c
            ON o.customerNumber = c.customerNumber
    """,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract classicmodels data from MySQL and write star-schema Parquet files."
    )
    parser.add_argument("--host", default=DEFAULT_MYSQL_HOST, help="MySQL host")
    parser.add_argument("--port", type=int, default=DEFAULT_MYSQL_PORT, help="MySQL port")
    parser.add_argument("--user", default=DEFAULT_MYSQL_USER, help="MySQL user")
    parser.add_argument("--password", default=DEFAULT_MYSQL_PASSWORD, help="MySQL password")
    parser.add_argument("--database", default=DEFAULT_MYSQL_DATABASE, help="MySQL database name")
    parser.add_argument(
        "--target-path",
        default=DEFAULT_TARGET_PATH,
        help="Output folder or S3 URI for the generated Parquet warehouse",
    )
    parser.add_argument("--s3-endpoint", default=DEFAULT_S3_ENDPOINT, help="S3-compatible endpoint URL")
    parser.add_argument("--s3-access-key-id", default=DEFAULT_S3_ACCESS_KEY_ID, help="S3 access key")
    parser.add_argument("--s3-secret-access-key", default=DEFAULT_S3_SECRET_ACCESS_KEY, help="S3 secret key")
    parser.add_argument("--s3-region", default=DEFAULT_S3_REGION, help="S3 region")
    parser.add_argument(
        "--no-overwrite",
        action="store_true",
        help="Fail if an output table folder already exists instead of replacing it",
    )
    return parser.parse_args()


def create_mysql_engine(args: argparse.Namespace) -> Engine:
    url = (
        f"mysql+pymysql://{args.user}:{args.password}"
        f"@{args.host}:{args.port}/{args.database}"
    )
    return create_engine(url, pool_pre_ping=True)


def check_connection(engine: Engine) -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def read_table(engine: Engine, table_name: str, sql: str) -> pd.DataFrame:
    print(f"Extracting {table_name}...")
    dataframe = pd.read_sql_query(sql, engine)
    print(f"  {table_name}: {len(dataframe):,} rows")
    return dataframe


def is_s3_uri(value: str) -> bool:
    return value.startswith("s3://")


def s3_client(args: argparse.Namespace):
    return boto3.client(
        "s3",
        endpoint_url=args.s3_endpoint,
        aws_access_key_id=args.s3_access_key_id,
        aws_secret_access_key=args.s3_secret_access_key,
        region_name=args.s3_region,
    )


def s3_table_key(target_path: str, table_name: str) -> tuple[str, str]:
    parsed = urlparse(target_path)
    if parsed.scheme != "s3" or not parsed.netloc:
        raise ValueError(f"Invalid S3 target path: {target_path}")

    prefix = parsed.path.lstrip("/").rstrip("/")
    key_parts = [part for part in [prefix, table_name, f"{table_name}.parquet"] if part]
    return parsed.netloc, "/".join(key_parts)


def write_local_parquet(
    dataframe: pd.DataFrame,
    target_path: Path,
    table_name: str,
    overwrite: bool,
) -> Path:
    table_path = target_path / table_name
    parquet_path = table_path / f"{table_name}.parquet"

    if table_path.exists():
        if not overwrite:
            raise FileExistsError(
                f"{table_path} already exists. Remove it or run without --no-overwrite."
            )
        shutil.rmtree(table_path)

    table_path.mkdir(parents=True, exist_ok=True)
    dataframe.to_parquet(
        parquet_path,
        engine="pyarrow",
        compression="snappy",
        index=False,
    )
    print(f"Loaded {table_name} -> {parquet_path}")
    return str(parquet_path)


def write_s3_parquet(
    dataframe: pd.DataFrame,
    target_path: str,
    table_name: str,
    client,
) -> str:
    bucket, key = s3_table_key(target_path, table_name)

    with tempfile.TemporaryDirectory() as temp_dir:
        parquet_path = Path(temp_dir) / f"{table_name}.parquet"
        dataframe.to_parquet(
            parquet_path,
            engine="pyarrow",
            compression="snappy",
            index=False,
        )
        client.upload_file(str(parquet_path), bucket, key)

    s3_uri = f"s3://{bucket}/{key}"
    print(f"Loaded {table_name} -> {s3_uri}")
    return s3_uri


def run_etl(args: argparse.Namespace) -> None:
    target_is_s3 = is_s3_uri(args.target_path)
    target_path = (
        args.target_path
        if target_is_s3
        else str(Path(args.target_path).expanduser().resolve())
    )
    overwrite = not args.no_overwrite

    print("Starting local ETL job")
    print(f"Source: mysql://{args.user}@{args.host}:{args.port}/{args.database}")
    print(f"Target: {target_path}")
    if target_is_s3:
        print(f"S3 endpoint: {args.s3_endpoint}")

    engine = create_mysql_engine(args)
    check_connection(engine)
    client = s3_client(args) if target_is_s3 else None

    written_files: list[str] = []
    for table_name, sql in TABLE_QUERIES.items():
        dataframe = read_table(engine, table_name, sql)
        if target_is_s3:
            written_files.append(write_s3_parquet(dataframe, target_path, table_name, client))
        else:
            written_files.append(
                write_local_parquet(dataframe, Path(target_path), table_name, overwrite)
            )

    print("\nETL job completed successfully.")
    print("Generated Parquet files:")
    for path in written_files:
        print(f"  - {path}")


def main() -> None:
    args = parse_args()
    run_etl(args)


if __name__ == "__main__":
    main()
