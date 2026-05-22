# Classic Models MySQL Sample Database

This folder contains the source database used by the data engineering lab.

The database is named `classicmodels`. It represents a retailer that sells scale models of classic cars and other vehicles. The data includes customers, products, orders, order line items, payments, employees, and office locations.

Source file:

```text
mysqlsampledatabase.sql
```

Schema image:

```text
classicmodels_schema.png
```

## Purpose

This database is an OLTP-style source system. In this lab, it plays the role of the operational MySQL database used by the application and the ETL pipeline.

The goal is to extract data from this normalized transactional database, transform it into an analytical model, and load it into an object-storage/data-lake style destination for querying and visualization.

## Tables

| Table | Description |
| --- | --- |
| `customers` | Stores customer details, contact information, location, credit limit, and assigned sales representative. |
| `products` | Stores scale model products, including name, product line, scale, vendor, stock, buy price, and MSRP. |
| `productlines` | Stores product categories such as Classic Cars, Motorcycles, Planes, Ships, Trains, Trucks and Buses, and Vintage Cars. |
| `orders` | Stores customer sales orders, including order dates, required dates, shipped dates, status, comments, and customer reference. |
| `orderdetails` | Stores individual line items for each order, including product, quantity ordered, price, and line number. |
| `payments` | Stores customer payments, including check number, payment date, and amount. |
| `employees` | Stores employee information, job titles, office assignment, and reporting hierarchy. |
| `offices` | Stores sales office locations, addresses, countries, and territories. |

## Main Relationships

The schema is normalized, so business entities are split into separate related tables.

Important relationships:

| Relationship | Meaning |
| --- | --- |
| `products.productLine` -> `productlines.productLine` | Each product belongs to one product line. |
| `employees.officeCode` -> `offices.officeCode` | Each employee belongs to an office. |
| `employees.reportsTo` -> `employees.employeeNumber` | Employees can report to another employee. |
| `customers.salesRepEmployeeNumber` -> `employees.employeeNumber` | A customer can be assigned to a sales representative. |
| `orders.customerNumber` -> `customers.customerNumber` | Each order belongs to a customer. |
| `orderdetails.orderNumber` -> `orders.orderNumber` | Each order has one or more order line items. |
| `orderdetails.productCode` -> `products.productCode` | Each order line item refers to a product. |
| `payments.customerNumber` -> `customers.customerNumber` | Payments are made by customers. |

## Primary Keys

| Table | Primary Key |
| --- | --- |
| `productlines` | `productLine` |
| `products` | `productCode` |
| `offices` | `officeCode` |
| `employees` | `employeeNumber` |
| `customers` | `customerNumber` |
| `payments` | `customerNumber`, `checkNumber` |
| `orders` | `orderNumber` |
| `orderdetails` | `orderNumber`, `productCode` |

## Business Questions This Database Can Answer

This dataset is useful for practicing SQL and data engineering because it supports realistic business questions, such as:

- Which product lines generate the most sales?
- Which countries have the highest sales?
- Which customers place the largest orders?
- Which products are ordered most frequently?
- Which sales representatives manage the highest-value customers?
- How do order statuses vary across time?
- How much has each customer paid?

## How to Load the Database

### Using Docker Compose

This folder includes a Docker setup that creates a MySQL container and loads `mysqlsampledatabase.sql` automatically the first time it starts.

From the repository root:

```bash
cd DB
docker compose up -d --build
```

Connect to MySQL:

```bash
docker exec -it classicmodels-mysql mysql -uadmin -padminpwrd classicmodels
```

Check the tables:

```sql
SHOW TABLES;
```

Stop the database:

```bash
docker compose down
```

Reset the database and reload the SQL file from scratch:

```bash
docker compose down -v
docker compose up -d --build
```

If you see `Cannot connect to the Docker daemon`, Docker Desktop or another Docker runtime is not running. Start your Docker runtime and then run:

```bash
docker info
docker compose up -d --build
```

If you use Colima as your Docker runtime, start it before running Docker commands:

```bash
brew install colima docker docker-compose
colima start --cpu 2 --memory 4 --disk 20
docker context use colima
docker compose up -d --build
```

If your Docker installation only supports the legacy Compose command, use:

```bash
docker-compose up -d --build
```

### Manual Load

If you are using the Docker-based local lab, the SQL file can be mounted into the MySQL container and loaded automatically during container initialization.

Example Docker Compose volume:

```yaml
volumes:
  - ./DB/mysqlsampledatabase.sql:/docker-entrypoint-initdb.d/mysqlsampledatabase.sql:ro
```

You can also load it manually into an existing MySQL server:

```bash
mysql -u root -p < DB/mysqlsampledatabase.sql
```

After loading, connect to the database:

```bash
mysql -u admin -p classicmodels
```

Then explore the schema:

```sql
SHOW TABLES;
DESCRIBE customers;
DESCRIBE orders;
DESCRIBE orderdetails;
```

## Example Queries

Total sales by product line:

```sql
SELECT
    p.productLine,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS totalSales
FROM orderdetails od
JOIN products p
    ON od.productCode = p.productCode
GROUP BY p.productLine
ORDER BY totalSales DESC;
```

Total sales by country:

```sql
SELECT
    c.country,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS totalSales
FROM customers c
JOIN orders o
    ON c.customerNumber = o.customerNumber
JOIN orderdetails od
    ON o.orderNumber = od.orderNumber
GROUP BY c.country
ORDER BY totalSales DESC;
```

Top customers by total order value:

```sql
SELECT
    c.customerName,
    c.country,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS totalSales
FROM customers c
JOIN orders o
    ON c.customerNumber = o.customerNumber
JOIN orderdetails od
    ON o.orderNumber = od.orderNumber
GROUP BY c.customerNumber, c.customerName, c.country
ORDER BY totalSales DESC
LIMIT 10;
```

## How This Fits the Lab

In a managed cloud version of this architecture:

```text
classicmodels MySQL database -> AWS Glue -> Amazon S3 -> Amazon Athena -> Jupyter dashboard
```

In the local/server version:

```text
classicmodels MySQL database -> Python ETL -> MinIO -> DuckDB -> Jupyter dashboard
```

This database is the starting point for the pipeline. It is intentionally normalized, which is good for transactional systems, but less convenient for analytics. The ETL step transforms it into a simpler analytical structure, usually with fact and dimension tables.
