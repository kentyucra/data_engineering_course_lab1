import "server-only";

import { query } from "@/lib/db";

export type Metric = {
  customers: number;
  orders: number;
  products: number;
  revenue: number;
  openOrders: number;
  countries: number;
};

export async function getMetrics() {
  const rows = await query<Metric>(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT ROUND(SUM(quantityOrdered * priceEach), 2) FROM orderdetails) AS revenue,
      (SELECT COUNT(*) FROM orders WHERE status IN ('In Process', 'On Hold', 'Disputed')) AS openOrders,
      (SELECT COUNT(DISTINCT country) FROM customers) AS countries
  `);
  return rows[0];
}

export async function getRecentOrders(limit = 8) {
  return query<{
    orderNumber: number;
    orderDate: string;
    status: string;
    customerName: string;
    country: string;
    total: number;
  }>(
    `
    SELECT
      o.orderNumber,
      o.orderDate,
      o.status,
      c.customerName,
      c.country,
      ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS total
    FROM orders o
    JOIN customers c ON c.customerNumber = o.customerNumber
    JOIN orderdetails od ON od.orderNumber = o.orderNumber
    GROUP BY o.orderNumber, o.orderDate, o.status, c.customerName, c.country
    ORDER BY o.orderDate DESC, o.orderNumber DESC
    LIMIT :limit
    `,
    { limit }
  );
}

export async function getCustomers() {
  return query<{
    customerNumber: number;
    customerName: string;
    contactName: string;
    country: string;
    city: string;
    salesRep: string | null;
    creditLimit: number | null;
    orderCount: number;
    lifetimeValue: number;
  }>(`
    SELECT
      c.customerNumber,
      c.customerName,
      CONCAT(c.contactFirstName, ' ', c.contactLastName) AS contactName,
      c.country,
      c.city,
      CONCAT(e.firstName, ' ', e.lastName) AS salesRep,
      c.creditLimit,
      COUNT(DISTINCT o.orderNumber) AS orderCount,
      COALESCE(ROUND(SUM(od.quantityOrdered * od.priceEach), 2), 0) AS lifetimeValue
    FROM customers c
    LEFT JOIN employees e ON e.employeeNumber = c.salesRepEmployeeNumber
    LEFT JOIN orders o ON o.customerNumber = c.customerNumber
    LEFT JOIN orderdetails od ON od.orderNumber = o.orderNumber
    GROUP BY c.customerNumber, c.customerName, contactName, c.country, c.city, salesRep, c.creditLimit
    ORDER BY lifetimeValue DESC, c.customerName
  `);
}

export async function getCustomer(customerNumber: number) {
  const rows = await query<{
    customerNumber: number;
    customerName: string;
    contactName: string;
    phone: string;
    address: string;
    city: string;
    state: string | null;
    country: string;
    postalCode: string | null;
    creditLimit: number | null;
    salesRep: string | null;
    salesRepEmail: string | null;
    officeCity: string | null;
  }>(
    `
    SELECT
      c.customerNumber,
      c.customerName,
      CONCAT(c.contactFirstName, ' ', c.contactLastName) AS contactName,
      c.phone,
      CONCAT(c.addressLine1, COALESCE(CONCAT(', ', c.addressLine2), '')) AS address,
      c.city,
      c.state,
      c.country,
      c.postalCode,
      c.creditLimit,
      CONCAT(e.firstName, ' ', e.lastName) AS salesRep,
      e.email AS salesRepEmail,
      off.city AS officeCity
    FROM customers c
    LEFT JOIN employees e ON e.employeeNumber = c.salesRepEmployeeNumber
    LEFT JOIN offices off ON off.officeCode = e.officeCode
    WHERE c.customerNumber = :customerNumber
    `,
    { customerNumber }
  );
  return rows[0] ?? null;
}

export async function getCustomerOrders(customerNumber: number) {
  return query<{
    orderNumber: number;
    orderDate: string;
    requiredDate: string;
    shippedDate: string | null;
    status: string;
    total: number;
  }>(
    `
    SELECT
      o.orderNumber,
      o.orderDate,
      o.requiredDate,
      o.shippedDate,
      o.status,
      ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS total
    FROM orders o
    JOIN orderdetails od ON od.orderNumber = o.orderNumber
    WHERE o.customerNumber = :customerNumber
    GROUP BY o.orderNumber, o.orderDate, o.requiredDate, o.shippedDate, o.status
    ORDER BY o.orderDate DESC
    `,
    { customerNumber }
  );
}

export async function getOrders() {
  return query<{
    orderNumber: number;
    orderDate: string;
    requiredDate: string;
    shippedDate: string | null;
    status: string;
    customerNumber: number;
    customerName: string;
    total: number;
  }>(`
    SELECT
      o.orderNumber,
      o.orderDate,
      o.requiredDate,
      o.shippedDate,
      o.status,
      c.customerNumber,
      c.customerName,
      ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS total
    FROM orders o
    JOIN customers c ON c.customerNumber = o.customerNumber
    JOIN orderdetails od ON od.orderNumber = o.orderNumber
    GROUP BY o.orderNumber, o.orderDate, o.requiredDate, o.shippedDate, o.status, c.customerNumber, c.customerName
    ORDER BY o.orderDate DESC, o.orderNumber DESC
  `);
}

export async function getOrder(orderNumber: number) {
  const rows = await query<{
    orderNumber: number;
    orderDate: string;
    requiredDate: string;
    shippedDate: string | null;
    status: string;
    comments: string | null;
    customerNumber: number;
    customerName: string;
    country: string;
    contactName: string;
    total: number;
  }>(
    `
    SELECT
      o.orderNumber,
      o.orderDate,
      o.requiredDate,
      o.shippedDate,
      o.status,
      o.comments,
      c.customerNumber,
      c.customerName,
      c.country,
      CONCAT(c.contactFirstName, ' ', c.contactLastName) AS contactName,
      ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS total
    FROM orders o
    JOIN customers c ON c.customerNumber = o.customerNumber
    JOIN orderdetails od ON od.orderNumber = o.orderNumber
    WHERE o.orderNumber = :orderNumber
    GROUP BY o.orderNumber, o.orderDate, o.requiredDate, o.shippedDate, o.status, o.comments,
      c.customerNumber, c.customerName, c.country, contactName
    `,
    { orderNumber }
  );
  return rows[0] ?? null;
}

export async function getOrderLines(orderNumber: number) {
  return query<{
    productCode: string;
    productName: string;
    productLine: string;
    quantityOrdered: number;
    priceEach: number;
    orderLineNumber: number;
    lineTotal: number;
  }>(
    `
    SELECT
      od.productCode,
      p.productName,
      p.productLine,
      od.quantityOrdered,
      od.priceEach,
      od.orderLineNumber,
      ROUND(od.quantityOrdered * od.priceEach, 2) AS lineTotal
    FROM orderdetails od
    JOIN products p ON p.productCode = od.productCode
    WHERE od.orderNumber = :orderNumber
    ORDER BY od.orderLineNumber
    `,
    { orderNumber }
  );
}

export async function getProducts() {
  return query<{
    productCode: string;
    productName: string;
    productLine: string;
    productVendor: string;
    productScale: string;
    quantityInStock: number;
    buyPrice: number;
    MSRP: number;
    orderedUnits: number;
    revenue: number;
  }>(`
    SELECT
      p.productCode,
      p.productName,
      p.productLine,
      p.productVendor,
      p.productScale,
      p.quantityInStock,
      p.buyPrice,
      p.MSRP,
      COALESCE(SUM(od.quantityOrdered), 0) AS orderedUnits,
      COALESCE(ROUND(SUM(od.quantityOrdered * od.priceEach), 2), 0) AS revenue
    FROM products p
    LEFT JOIN orderdetails od ON od.productCode = p.productCode
    GROUP BY p.productCode, p.productName, p.productLine, p.productVendor, p.productScale,
      p.quantityInStock, p.buyPrice, p.MSRP
    ORDER BY revenue DESC, p.productName
  `);
}

export async function getEmployees() {
  return query<{
    employeeNumber: number;
    employeeName: string;
    jobTitle: string;
    email: string;
    officeCity: string;
    country: string;
    manager: string | null;
    customerCount: number;
    managedRevenue: number;
  }>(`
    SELECT
      e.employeeNumber,
      CONCAT(e.firstName, ' ', e.lastName) AS employeeName,
      e.jobTitle,
      e.email,
      o.city AS officeCity,
      o.country,
      CONCAT(m.firstName, ' ', m.lastName) AS manager,
      COUNT(DISTINCT c.customerNumber) AS customerCount,
      COALESCE(ROUND(SUM(od.quantityOrdered * od.priceEach), 2), 0) AS managedRevenue
    FROM employees e
    JOIN offices o ON o.officeCode = e.officeCode
    LEFT JOIN employees m ON m.employeeNumber = e.reportsTo
    LEFT JOIN customers c ON c.salesRepEmployeeNumber = e.employeeNumber
    LEFT JOIN orders ord ON ord.customerNumber = c.customerNumber
    LEFT JOIN orderdetails od ON od.orderNumber = ord.orderNumber
    GROUP BY e.employeeNumber, employeeName, e.jobTitle, e.email, o.city, o.country, manager
    ORDER BY managedRevenue DESC, employeeName
  `);
}

export async function getSalesByProductLine() {
  return query<{ productLine: string; revenue: number; units: number }>(`
    SELECT
      p.productLine,
      ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue,
      SUM(od.quantityOrdered) AS units
    FROM orderdetails od
    JOIN products p ON p.productCode = od.productCode
    GROUP BY p.productLine
    ORDER BY revenue DESC
  `);
}

export async function getSalesByCountry() {
  return query<{ country: string; revenue: number; orders: number }>(`
    SELECT
      c.country,
      ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue,
      COUNT(DISTINCT o.orderNumber) AS orders
    FROM customers c
    JOIN orders o ON o.customerNumber = c.customerNumber
    JOIN orderdetails od ON od.orderNumber = o.orderNumber
    GROUP BY c.country
    ORDER BY revenue DESC
    LIMIT 12
  `);
}

export async function getOrderStatusSummary() {
  return query<{ status: string; orders: number }>(`
    SELECT status, COUNT(*) AS orders
    FROM orders
    GROUP BY status
    ORDER BY orders DESC
  `);
}
