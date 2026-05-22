# Classic Models Operations Frontend

This is a small internal-operations app for the `classicmodels` MySQL database.

It is intentionally built like a real business tool: employees can browse customers, orders, products, staff ownership, and lightweight reports backed by SQL queries over the normalized database.

## Run Locally

Make sure the database container is running from the `db` folder:

```bash
cd ../db
docker-compose up -d --build
```

Install and run the frontend:

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Run with Docker

With the MySQL container already running from `db/`, build and start the frontend:

```bash
cd frontend
docker-compose up -d --build
```

Open:

```text
http://localhost:3000
```

On macOS with Colima, the Docker setup uses `host.docker.internal` to reach the MySQL port exposed by the database container.

## Database Settings

The app expects:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=adminpwrd
DB_NAME=classicmodels
```

## Why This Exists

Before students build an ETL pipeline, this app shows the operational side of the system:

1. Users interact with a business application.
2. The application reads and writes normalized MySQL tables.
3. Operational schemas are good for transactions.
4. Analytical questions require joins and aggregation.
5. The data engineering pipeline later reshapes this data for easier analysis.
