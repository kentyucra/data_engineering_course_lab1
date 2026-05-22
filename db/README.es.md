# Base de Datos de Ejemplo MySQL Classic Models

Esta carpeta contiene la base de datos de origen usada por el laboratorio de data engineering.

La base de datos se llama `classicmodels`. Representa una tienda que vende modelos a escala de autos clásicos y otros vehículos. Los datos incluyen clientes, productos, órdenes, líneas de detalle de órdenes, pagos, empleados y ubicaciones de oficinas.

Archivo fuente:

```text
mysqlsampledatabase.sql
```

Imagen del esquema:

```text
classicmodels_schema.png
```

## Propósito

Esta base de datos es un sistema de origen de estilo OLTP. En este laboratorio, cumple el rol de la base de datos operacional MySQL usada por la aplicación y por el pipeline ETL.

El objetivo es extraer datos desde esta base transaccional normalizada, transformarlos en un modelo analítico y cargarlos en un destino de tipo object storage/data lake para consultas y visualización.

## Tablas

| Tabla | Descripción |
| --- | --- |
| `customers` | Guarda detalles de clientes, información de contacto, ubicación, límite de crédito y representante de ventas asignado. |
| `products` | Guarda productos de modelos a escala, incluyendo nombre, línea de producto, escala, proveedor, stock, precio de compra y MSRP. |
| `productlines` | Guarda categorías de productos como Classic Cars, Motorcycles, Planes, Ships, Trains, Trucks and Buses, y Vintage Cars. |
| `orders` | Guarda órdenes de clientes, incluyendo fechas de orden, fechas requeridas, fechas de envío, estado, comentarios y referencia del cliente. |
| `orderdetails` | Guarda las líneas individuales de cada orden, incluyendo producto, cantidad ordenada, precio y número de línea. |
| `payments` | Guarda pagos de clientes, incluyendo número de cheque, fecha de pago y monto. |
| `employees` | Guarda información de empleados, cargos, oficina asignada y jerarquía de reportes. |
| `offices` | Guarda ubicaciones, direcciones, países y territorios de oficinas de ventas. |

## Relaciones Principales

El esquema está normalizado, por lo que las entidades de negocio se dividen en tablas separadas pero relacionadas.

Relaciones importantes:

| Relación | Significado |
| --- | --- |
| `products.productLine` -> `productlines.productLine` | Cada producto pertenece a una línea de producto. |
| `employees.officeCode` -> `offices.officeCode` | Cada empleado pertenece a una oficina. |
| `employees.reportsTo` -> `employees.employeeNumber` | Los empleados pueden reportar a otro empleado. |
| `customers.salesRepEmployeeNumber` -> `employees.employeeNumber` | Un cliente puede tener asignado un representante de ventas. |
| `orders.customerNumber` -> `customers.customerNumber` | Cada orden pertenece a un cliente. |
| `orderdetails.orderNumber` -> `orders.orderNumber` | Cada orden tiene una o más líneas de detalle. |
| `orderdetails.productCode` -> `products.productCode` | Cada línea de detalle se refiere a un producto. |
| `payments.customerNumber` -> `customers.customerNumber` | Los pagos son realizados por clientes. |

## Llaves Primarias

| Tabla | Llave primaria |
| --- | --- |
| `productlines` | `productLine` |
| `products` | `productCode` |
| `offices` | `officeCode` |
| `employees` | `employeeNumber` |
| `customers` | `customerNumber` |
| `payments` | `customerNumber`, `checkNumber` |
| `orders` | `orderNumber` |
| `orderdetails` | `orderNumber`, `productCode` |

## Preguntas de Negocio que Esta Base Puede Responder

Este dataset es útil para practicar SQL y data engineering porque soporta preguntas de negocio realistas, como:

- ¿Qué líneas de producto generan más ventas?
- ¿Qué países tienen las ventas más altas?
- ¿Qué clientes realizan las órdenes más grandes?
- ¿Qué productos se ordenan con mayor frecuencia?
- ¿Qué representantes de ventas gestionan los clientes de mayor valor?
- ¿Cómo varían los estados de las órdenes a lo largo del tiempo?
- ¿Cuánto ha pagado cada cliente?

## Cómo Cargar la Base de Datos

### Usando Docker Compose

Esta carpeta incluye una configuración Docker que crea un contenedor MySQL y carga `mysqlsampledatabase.sql` automáticamente la primera vez que inicia.

Desde la raíz del repositorio:

```bash
cd DB
docker compose up -d --build
```

Conectarse a MySQL:

```bash
docker exec -it classicmodels-mysql mysql -uadmin -padminpwrd classicmodels
```

Revisar las tablas:

```sql
SHOW TABLES;
```

Detener la base de datos:

```bash
docker compose down
```

Reiniciar la base y recargar el archivo SQL desde cero:

```bash
docker compose down -v
docker compose up -d --build
```

Si ves `Cannot connect to the Docker daemon`, Docker Desktop u otro runtime de Docker no está corriendo. Inicia tu runtime de Docker y luego ejecuta:

```bash
docker info
docker compose up -d --build
```

Si usas Colima como runtime de Docker, inícialo antes de ejecutar comandos Docker:

```bash
brew install colima docker docker-compose
colima start --cpu 2 --memory 4 --disk 20
docker context use colima
docker compose up -d --build
```

Si tu instalación de Docker solo soporta el comando legacy de Compose, usa:

```bash
docker-compose up -d --build
```

### Carga Manual

Si estás usando el laboratorio local basado en Docker, el archivo SQL puede montarse dentro del contenedor MySQL y cargarse automáticamente durante la inicialización.

Ejemplo de volumen en Docker Compose:

```yaml
volumes:
  - ./DB/mysqlsampledatabase.sql:/docker-entrypoint-initdb.d/mysqlsampledatabase.sql:ro
```

También puedes cargarlo manualmente en un servidor MySQL existente:

```bash
mysql -u root -p < DB/mysqlsampledatabase.sql
```

Después de cargarlo, conéctate a la base:

```bash
mysql -u admin -p classicmodels
```

Luego explora el esquema:

```sql
SHOW TABLES;
DESCRIBE customers;
DESCRIBE orders;
DESCRIBE orderdetails;
```

## Consultas de Ejemplo

Ventas totales por línea de producto:

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

Ventas totales por país:

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

Clientes principales por valor total de órdenes:

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

## Cómo Encaja en el Laboratorio

En una versión cloud administrada de esta arquitectura:

```text
base de datos MySQL classicmodels -> AWS Glue -> Amazon S3 -> Amazon Athena -> dashboard Jupyter
```

En la versión local/servidor:

```text
base de datos MySQL classicmodels -> ETL en Python -> MinIO -> DuckDB -> dashboard Jupyter
```

Esta base de datos es el punto de partida del pipeline. Está intencionalmente normalizada, lo cual es bueno para sistemas transaccionales, pero menos conveniente para analytics. El paso ETL la transforma en una estructura analítica más simple, normalmente con tablas de hechos y dimensiones.
