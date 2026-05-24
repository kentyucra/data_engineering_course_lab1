# Database Structure and Parquet Conversion

This guide explains the current structure of the `classicmodels` database and how it is transformed into Parquet files for analytics.

The goal is to build the idea progressively and intuitively, starting from real-life business concepts.

## Big Picture

The database represents a company that sells miniature scale models, such as classic cars, motorcycles, planes, ships, trains, and trucks.

In real life, the business works like this:

```text
Customers buy products.
Products belong to categories.
Customers place orders.
Orders contain individual products.
Customers make payments.
Employees manage customers.
Employees work from offices.
```

That is basically what the database stores.

## Product Lines

A `productLine` is a product category.

Imagine a toy or model store. The store does not only sell "products"; it organizes them into categories.

Examples:

```text
Classic Cars
Motorcycles
Planes
Ships
Trains
Trucks and Buses
Vintage Cars
```

Those categories are called product lines in this database.

The `productlines` table stores those categories.

Example:

| productLine | textDescription |
| --- | --- |
| Classic Cars | Models of classic automobiles |
| Motorcycles | Models of motorcycles |
| Planes | Models of aircraft |
| Ships | Models of ships |

The `products` table stores the actual items being sold.

Example:

| productCode | productName | productLine |
| --- | --- | --- |
| S10_1949 | 1952 Alpine Renault 1300 | Classic Cars |
| S10_2016 | 1996 Moto Guzzi 1100i | Motorcycles |
| S18_1662 | 1980s Black Hawk Helicopter | Planes |

The relationship is:

```text
One product line has many products.
One product belongs to one product line.
```

Real-life example:

```text
Category: Classic Cars
  - 1952 Alpine Renault 1300
  - 1968 Ford Mustang
  - 1969 Dodge Charger

Category: Motorcycles
  - 1996 Moto Guzzi 1100i
  - 2003 Harley-Davidson Eagle
```

In database terms:

```text
products.productLine -> productlines.productLine
```

## Products

A product is the actual item the company sells.

The `products` table contains fields like:

```text
productCode
productName
productLine
productScale
productVendor
quantityInStock
buyPrice
MSRP
```

Example:

| productCode | productName | productLine | buyPrice | MSRP |
| --- | --- | --- | --- | --- |
| S10_1949 | 1952 Alpine Renault 1300 | Classic Cars | 98.58 | 214.30 |

Meaning:

```text
The company buys this model for 98.58.
The suggested selling price is 214.30.
It belongs to the Classic Cars product line.
```

Real-life analogy:

```text
Product: iPhone 15 Pro
Category or product line: Smartphones
Vendor: Apple
Buy price: what the store pays Apple
MSRP: suggested retail price
Stock: how many are available
```

## Customers

A customer is a company or person who buys from the business.

The `customers` table stores:

```text
customerNumber
customerName
contactFirstName
contactLastName
phone
address
city
country
salesRepEmployeeNumber
creditLimit
```

Example:

| customerNumber | customerName | country | creditLimit |
| --- | --- | --- | --- |
| 103 | Atelier graphique | France | 21000.00 |

Meaning:

```text
Atelier graphique is a customer in France.
They have a credit limit of 21,000.
They may have a sales representative assigned.
```

## Orders

An order is a purchase made by a customer.

The important idea is that an order has two levels:

```text
Order header
Order details or line items
```

Real-life receipt example:

```text
Order #10100
Customer: Atelier graphique
Date: 2003-01-06
Status: Shipped

Items:
  1. 30 units of 1917 Grand Touring Sedan at 136.00 each
  2. 50 units of 1911 Ford Town Car at 55.09 each
  3. 22 units of 1932 Alfa Romeo at 75.46 each
```

The `orders` table stores the order header.

Example:

| orderNumber | orderDate | status | customerNumber |
| --- | --- | --- | --- |
| 10100 | 2003-01-06 | Shipped | 363 |

The `orderdetails` table stores the individual products inside that order.

Example:

| orderNumber | productCode | quantityOrdered | priceEach |
| --- | --- | --- | --- |
| 10100 | S18_1749 | 30 | 136.00 |
| 10100 | S18_2248 | 50 | 55.09 |
| 10100 | S18_4409 | 22 | 75.46 |

So:

```text
One customer can have many orders.
One order can have many order details.
One order detail points to one product.
```

## Why Orders and Order Details Are Separate

An order can contain multiple products.

If everything were stored in one table, the same order information would repeat again and again.

Example:

| orderNumber | orderDate | customer | product | quantity |
| --- | --- | --- | --- | --- |
| 10100 | 2003-01-06 | Atelier graphique | Product A | 30 |
| 10100 | 2003-01-06 | Atelier graphique | Product B | 50 |
| 10100 | 2003-01-06 | Atelier graphique | Product C | 22 |

Notice how `orderDate` and `customer` repeat.

Databases avoid unnecessary repetition by splitting data:

```text
orders
  stores order-level information once

orderdetails
  stores each product line inside the order
```

This is called normalization.

## Payments

The `payments` table stores money received from customers.

Example:

| customerNumber | checkNumber | paymentDate | amount |
| --- | --- | --- | --- |
| 103 | HQ336336 | 2004-10-19 | 6066.78 |

Meaning:

```text
Customer 103 made a payment of 6,066.78 using check HQ336336.
```

Important detail:

```text
Payments are connected to customers, not directly to orders.
```

So the database can easily answer:

```text
How much has this customer paid in total?
```

But matching one payment to one exact order is not directly modeled here.

## Employees and Offices

The company has employees who work from offices.

The `offices` table stores office locations.

Example:

| officeCode | city | country |
| --- | --- | --- |
| 1 | San Francisco | USA |
| 4 | Paris | France |

The `employees` table stores staff information.

Example:

| employeeNumber | firstName | lastName | officeCode | jobTitle |
| --- | --- | --- | --- | --- |
| 1370 | Gerard | Hernandez | 4 | Sales Rep |

Customers can be assigned to employees:

```text
customers.salesRepEmployeeNumber -> employees.employeeNumber
```

Real-life meaning:

```text
A customer is managed by a specific sales representative.
That sales representative works in an office.
```

## Source Database Mental Map

The operational database tells this story:

```text
Employees work in offices.
Employees manage customers.
Customers place orders.
Orders contain products.
Products belong to product lines.
Customers make payments.
```

Simple relationship map:

```text
offices
  -> employees
    -> customers
      -> orders
        -> orderdetails
          -> products
            -> productlines

customers
  -> payments
```

## Main Source Tables

| Table | What it stores | Primary key |
| --- | --- | --- |
| `productlines` | Product categories | `productLine` |
| `products` | Products, vendor, stock, buy price, MSRP | `productCode` |
| `offices` | Office locations | `officeCode` |
| `employees` | Staff, office, reporting manager | `employeeNumber` |
| `customers` | Customer profile, location, sales rep, credit limit | `customerNumber` |
| `payments` | Customer payments | `customerNumber` + `checkNumber` |
| `orders` | Order header: dates, status, customer | `orderNumber` |
| `orderdetails` | Order line items: product, quantity, price | `orderNumber` + `productCode` |

## Why Convert the Database to Parquet

The MySQL database is good for daily operations:

```text
Create a customer
Update an order status
Record a payment
Check product stock
Assign a sales representative
```

But dashboards usually ask analytical questions:

```text
Which product lines generate the most revenue?
Which countries sell the most?
Which products are most profitable?
Which customers buy the most?
How much revenue did we make per month?
```

To answer those questions from the original MySQL database, many joins are needed.

Example question:

```text
Revenue by product line
```

To answer it from MySQL, the query needs this path:

```text
orders
  -> orderdetails
    -> products
      -> productlines
```

That is correct, but repetitive for dashboard work.

The ETL creates easier analytical tables stored as Parquet files.

## What ETL Means

ETL means:

```text
Extract: read from MySQL
Transform: reshape and join the data
Load: write Parquet files
```

In this project:

```text
MySQL classicmodels
  -> Python ETL
    -> Parquet files
      -> DuckDB/Jupyter dashboard
```

The final Parquet files are:

```text
dim_customers
dim_products
dim_locations
fact_orders
```

## Dimensions and Facts

This is one of the most important analytics concepts in the lab.

A dimension describes something.

Examples:

```text
Customer
Product
Location
Date
Employee
```

A fact records something that happened.

Examples:

```text
An order line happened.
A payment happened.
A shipment happened.
A sale happened.
```

In this project:

```text
dim_products describes products.
dim_customers describes customers.
dim_locations describes places.
fact_orders records sales/order lines.
```

Simple analogy:

```text
Fact: Maria bought 2 coffees for 5 each.

Dimensions:
  Customer: Maria
  Product: Coffee
  Location: Lima
  Date: Monday
```

The fact has the numeric business event:

```text
quantity = 2
price = 5
amount = 10
```

The dimensions explain the context:

```text
who, what, where, when
```

## Analytical Parquet Tables

The ETL creates a small star schema.

```text
             dim_customers
                  |
dim_products - fact_orders - dim_locations
```

## `dim_customers`

This table comes from `customers`.

It keeps customer identity, contact, address, and account fields.

Useful columns:

```text
customerNumber
customerName
contactLastName
contactFirstName
phone
addressLine1
addressLine2
creditLimit
```

Example use:

```text
Join fact_orders to dim_customers when you want sales by customer.
```

## `dim_products`

This table comes from `products` joined to `productlines`.

It gives product details plus the product-line description.

Useful columns:

```text
productCode
productName
productLine
productScale
productVendor
productDescription
productLineDescription
```

Example use:

```text
Join fact_orders to dim_products when you want sales by product or product line.
```

## `dim_locations`

This table comes from distinct customer locations in `customers`.

Useful columns:

```text
postalCode
city
state
country
```

Example use:

```text
Join fact_orders to dim_locations when you want sales by city, state, or country.
```

## `fact_orders`

This is the main analytical table.

One row represents one order line.

That means one product inside one order.

Useful columns:

```text
orderLineNumber
orderNumber
customerNumber
postalCode
productCode
orderDate
requiredDate
shippedDate
status
comments
quantityOrdered
priceEach
orderAmount
buyPrice
MSRP
```

Example row:

| orderNumber | productCode | customerNumber | quantityOrdered | priceEach | orderAmount |
| --- | --- | --- | --- | --- | --- |
| 10100 | S18_1749 | 363 | 30 | 136.00 | 4080.00 |

The ETL calculates:

```text
orderAmount = quantityOrdered * priceEach
```

So:

```text
30 * 136.00 = 4080.00
```

This is why dashboards can easily use:

```sql
SUM(orderAmount)
```

to calculate revenue.

## How `fact_orders` Connects to Dimensions

The fact table keeps IDs like:

```text
customerNumber
productCode
postalCode
```

Those IDs connect to dimension tables:

```text
fact_orders.customerNumber -> dim_customers.customerNumber
fact_orders.productCode -> dim_products.productCode
fact_orders.postalCode -> dim_locations.postalCode
```

If `fact_orders` says:

```text
productCode = S18_1749
customerNumber = 363
postalCode = 44000
orderAmount = 4080
```

You join dimensions to understand it:

```text
S18_1749 = 1917 Grand Touring Sedan
363 = Dragon Souveniers, Ltd.
44000 = Nantes, France
```

## Real-Life Dashboard Example

Business question:

```text
Which product lines made the most money?
```

Needed from `fact_orders`:

```text
orderAmount
productCode
```

Needed from `dim_products`:

```text
productName
productLine
```

Query:

```sql
SELECT
    p.productLine,
    ROUND(SUM(f.orderAmount), 2) AS total_sales
FROM read_parquet('s3://classicmodels/warehouse/fact_orders/*.parquet') f
JOIN read_parquet('s3://classicmodels/warehouse/dim_products/*.parquet') p
    ON f.productCode = p.productCode
GROUP BY p.productLine
ORDER BY total_sales DESC;
```

Plain-English translation:

```text
Take every sale line.
Find the product for that sale line.
Look up the product's category.
Add all sales amounts by category.
Show the biggest categories first.
```

## Where the Parquet Files Are Stored

Local path:

```text
warehouse/dim_customers/dim_customers.parquet
warehouse/dim_products/dim_products.parquet
warehouse/dim_locations/dim_locations.parquet
warehouse/fact_orders/fact_orders.parquet
```

MinIO/S3 path:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

## Progressive Mental Model

Start with this:

```text
Product line = category
Product = item being sold
Customer = buyer
Order = purchase
Order detail = one product inside the purchase
Payment = money received
Employee = sales representative
Office = where employee works
```

Then move to this:

```text
Operational DB = many normalized tables for running the business
Analytical Parquet = fewer reshaped tables for answering business questions
```

Finally:

```text
Dimensions describe things.
Facts record events and numbers.
Dashboards join facts to dimensions.
```

That is the heart of this project.

