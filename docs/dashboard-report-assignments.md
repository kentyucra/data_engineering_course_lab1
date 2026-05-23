# Dashboard Report Assignments

This document gives each student group a medium-to-hard analytics task to build inside the Jupyter dashboard notebook.

The goal is to practice how analysts and data engineers use a transformed data lake: query Parquet files from MinIO with DuckDB, create DataFrames, and turn the results into useful business reports.

## Class Setup

There are 30 students split into 5 groups of 6 students.

Each group should create its own notebook copy before starting:

```text
classicmodels_dashboard_group_1.ipynb
classicmodels_dashboard_group_2.ipynb
classicmodels_dashboard_group_3.ipynb
classicmodels_dashboard_group_4.ipynb
classicmodels_dashboard_group_5.ipynb
```

All groups use the same analytical data in MinIO:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

## Available Tables

### `fact_orders`

Main analytical fact table. One row represents an order line.

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

### `dim_customers`

Customer dimension.

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

### `dim_products`

Product dimension.

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

### `dim_locations`

Customer location dimension.

Useful columns:

```text
postalCode
city
state
country
```

## Common Query Pattern

Each group can start from this pattern inside the notebook:

```python
query = """
SELECT
    p.productLine,
    ROUND(SUM(f.orderAmount), 2) AS total_sales
FROM read_parquet('s3://classicmodels/warehouse/fact_orders/*.parquet') f
JOIN read_parquet('s3://classicmodels/warehouse/dim_products/*.parquet') p
    ON f.productCode = p.productCode
GROUP BY p.productLine
ORDER BY total_sales DESC
"""

df = con.sql(query).df()
df.head()
```

Groups should create new SQL queries, not only reuse the existing dashboard cells.

## Required Deliverables

Each group must deliver:

1. A copied notebook with a clear group name.
2. At least 3 new SQL queries using DuckDB.
3. At least 2 new charts.
4. At least 1 ranked table or exception report.
5. A short written interpretation for each chart or table.
6. One final business recommendation based on the analysis.

## Group 1: Sales Performance and Revenue Concentration

Business question:

Which products, product lines, and customers drive the most revenue, and is the business too concentrated in a few areas?

Suggested reports:

1. **Revenue by product line**
   - Chart type: horizontal bar chart.
   - Columns: `productLine`, total `orderAmount`.
   - Add percentage of total revenue.

2. **Top 15 products by revenue**
   - Output type: ranked table.
   - Columns: `productName`, `productLine`, total revenue, total quantity, average selling price.
   - Difficulty: include both revenue and volume so students can explain high-price vs high-volume products.

3. **Customer revenue concentration**
   - Chart type: Pareto chart or cumulative percentage line.
   - Columns: `customerName`, revenue, cumulative revenue percentage.
   - Question: how many customers generate 50 percent or 80 percent of revenue?

4. **Revenue by product vendor**
   - Chart type: bar chart.
   - Columns: `productVendor`, total revenue, distinct products sold.
   - Question: which vendors are most important to protect?

5. **Executive summary table**
   - Output type: one-row KPI table.
   - Include total revenue, total orders, total customers, total products sold, average order line value.

Medium-to-hard challenge:

Create a Pareto-style customer concentration report using a window function:

```sql
SUM(customer_revenue) OVER (ORDER BY customer_revenue DESC)
```

## Group 2: Geography, Markets, and Regional Opportunity

Business question:

Which countries and cities are strongest, and where might the company have growth opportunities?

Suggested reports:

1. **Revenue by country**
   - Chart type: sorted bar chart.
   - Columns: `country`, total revenue, number of customers, number of orders.

2. **Average revenue per customer by country**
   - Chart type: bar chart.
   - Columns: `country`, revenue per customer.
   - Filter: countries with at least 2 customers or 2 orders to avoid misleading small samples.

3. **Top cities by revenue**
   - Output type: ranked table.
   - Columns: `city`, `country`, revenue, orders, customers.

4. **Product line preference by country**
   - Chart type: heatmap.
   - Rows: `country`.
   - Columns: `productLine`.
   - Values: revenue.
   - Difficulty: limit to top countries so the heatmap remains readable.

5. **Underdeveloped markets**
   - Output type: exception table.
   - Find countries with high average order value but low number of customers.
   - Question: could these be expansion opportunities?

Medium-to-hard challenge:

Build a country ranking that combines revenue rank, customer count rank, and average order value rank.

## Group 3: Profitability, Margin, and Pricing

Business question:

Which products and product lines generate the strongest gross margin, and where might pricing strategy need attention?

Suggested reports:

1. **Gross margin by product line**
   - Chart type: bar chart.
   - Formula:

```text
gross_margin = orderAmount - (quantityOrdered * buyPrice)
gross_margin_pct = gross_margin / orderAmount
```

2. **Most profitable products**
   - Output type: ranked table.
   - Columns: `productName`, `productLine`, revenue, gross margin, gross margin percentage.

3. **Low-margin high-revenue products**
   - Output type: exception table.
   - Find products with high revenue but below-average margin percentage.
   - Question: are these products risky or strategically important?

4. **Selling price vs MSRP**
   - Chart type: scatter plot.
   - X-axis: `MSRP`.
   - Y-axis: average `priceEach`.
   - Color: `productLine`.
   - Question: which product lines sell closest to or farthest from MSRP?

5. **Discount pressure report**
   - Output type: ranked table.
   - Formula:

```text
discount_pct = (MSRP - priceEach) / MSRP
```

Medium-to-hard challenge:

Create a scatter plot that compares revenue and margin percentage per product, then label the top 5 revenue products.

## Group 4: Operations, Shipping, and Order Status

Business question:

How healthy is the order fulfillment process, and where do delays or status problems appear?

Suggested reports:

1. **Order status distribution**
   - Chart type: bar chart.
   - Columns: `status`, count of distinct `orderNumber`, total revenue.

2. **Shipping delay analysis**
   - Formula:

```text
days_to_ship = shippedDate - orderDate
shipping_delay = shippedDate - requiredDate
```

   - Chart type: histogram or box plot.
   - Question: how long does shipping usually take?

3. **Late shipments**
   - Output type: exception table.
   - Rows where `shippedDate > requiredDate`.
   - Columns: order number, customer, country, required date, shipped date, days late, order value.

4. **Delay by country**
   - Chart type: bar chart.
   - Columns: `country`, average days to ship, late shipment rate.
   - Difficulty: use distinct orders so large orders with many lines do not overcount.

5. **Order value by status**
   - Chart type: box plot.
   - Question: are high-value orders more likely to have problematic statuses?

Medium-to-hard challenge:

Create a report at the order level first, then aggregate it. The fact table is at order-line level, so avoid counting the same order multiple times when analyzing shipping.

## Group 5: Customer Risk, Credit Limit, and Account Quality

Business question:

Which customers look valuable, risky, underused, or worth more attention from the business?

Suggested reports:

1. **Customer value vs credit limit**
   - Chart type: scatter plot.
   - X-axis: `creditLimit`.
   - Y-axis: total revenue.
   - Size: number of orders.
   - Question: which customers buy far above or below their credit limit?

2. **Credit utilization proxy**
   - Output type: ranked table.
   - Formula:

```text
revenue_to_credit_ratio = total_revenue / creditLimit
```

   - Filter: customers with non-null and positive credit limit.

3. **High credit, low activity customers**
   - Output type: exception table.
   - Find customers with high credit limit but low total revenue.
   - Question: are these missed sales opportunities?

4. **Customer order frequency**
   - Chart type: histogram.
   - Columns: number of distinct orders per customer.
   - Question: is the business driven by repeat customers or occasional buyers?

5. **Customer segmentation**
   - Output type: table and chart.
   - Create segments such as:
     - high value / high activity
     - high value / low activity
     - low value / high credit
     - low value / low activity

Medium-to-hard challenge:

Create customer segments using percentiles:

```sql
NTILE(4) OVER (ORDER BY total_revenue)
```

Then compare behavior across quartiles.

## Optional Advanced Challenges

These can be assigned to groups that finish early.

1. **Time series revenue trend**
   - Group revenue by month using `DATE_TRUNC('month', orderDate)`.
   - Chart monthly revenue and number of orders.

2. **Product mix over time**
   - Show how product line revenue changes by month or quarter.
   - Chart type: stacked bar chart or line chart.

3. **Anomaly report**
   - Find unusually large order lines.
   - Use z-score or percentile thresholds.

4. **Reusable dashboard filter**
   - Add an `ipywidgets` dropdown for country or product line.
   - Update charts based on the selected value.

5. **Data quality checks**
   - Count nulls in key columns.
   - Find orders with missing shipped dates.
   - Find products with zero or negative margin.

## Teaching Notes

Common issues to watch for:

- The fact table is at order-line level, so order-level reports should use `COUNT(DISTINCT orderNumber)` or build an order-level subquery first.
- Margin calculations need `quantityOrdered`, `buyPrice`, and `orderAmount`.
- Geography reports require joining `fact_orders` to `dim_locations` through `postalCode`.
- Product reports require joining `fact_orders` to `dim_products` through `productCode`.
- Customer reports require joining `fact_orders` to `dim_customers` through `customerNumber`.
- Public dashboards should avoid exposing sensitive credentials or editable shared notebooks without access control.
