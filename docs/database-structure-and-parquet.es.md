# Estructura de la Base de Datos y Conversion a Parquet

Esta guia explica la estructura actual de la base de datos `classicmodels` y como se transforma en archivos Parquet para analitica.

El objetivo es construir la idea de forma progresiva e intuitiva, empezando desde conceptos de negocio de la vida real.

## Vision General

La base de datos representa una empresa que vende modelos a escala en miniatura, como autos clasicos, motocicletas, aviones, barcos, trenes y camiones.

En la vida real, el negocio funciona asi:

```text
Los clientes compran productos.
Los productos pertenecen a categorias.
Los clientes hacen pedidos.
Los pedidos contienen productos individuales.
Los clientes hacen pagos.
Los empleados gestionan clientes.
Los empleados trabajan desde oficinas.
```

Eso es basicamente lo que almacena la base de datos.

## Lineas de Producto

Un `productLine` es una categoria de producto.

Imagina una tienda de juguetes o modelos a escala. La tienda no solo vende "productos"; los organiza en categorias.

Ejemplos:

```text
Classic Cars
Motorcycles
Planes
Ships
Trains
Trucks and Buses
Vintage Cars
```

En esta base de datos, esas categorias se llaman lineas de producto.

La tabla `productlines` almacena esas categorias.

Ejemplo:

| productLine | textDescription |
| --- | --- |
| Classic Cars | Modelos de automoviles clasicos |
| Motorcycles | Modelos de motocicletas |
| Planes | Modelos de aviones |
| Ships | Modelos de barcos |

La tabla `products` almacena los articulos reales que se venden.

Ejemplo:

| productCode | productName | productLine |
| --- | --- | --- |
| S10_1949 | 1952 Alpine Renault 1300 | Classic Cars |
| S10_2016 | 1996 Moto Guzzi 1100i | Motorcycles |
| S18_1662 | 1980s Black Hawk Helicopter | Planes |

La relacion es:

```text
Una linea de producto tiene muchos productos.
Un producto pertenece a una sola linea de producto.
```

Ejemplo de la vida real:

```text
Categoria: Classic Cars
  - 1952 Alpine Renault 1300
  - 1968 Ford Mustang
  - 1969 Dodge Charger

Categoria: Motorcycles
  - 1996 Moto Guzzi 1100i
  - 2003 Harley-Davidson Eagle
```

En terminos de base de datos:

```text
products.productLine -> productlines.productLine
```

## Productos

Un producto es el articulo real que vende la empresa.

La tabla `products` contiene campos como:

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

Ejemplo:

| productCode | productName | productLine | buyPrice | MSRP |
| --- | --- | --- | --- | --- |
| S10_1949 | 1952 Alpine Renault 1300 | Classic Cars | 98.58 | 214.30 |

Significado:

```text
La empresa compra este modelo por 98.58.
El precio sugerido de venta es 214.30.
Pertenece a la linea de producto Classic Cars.
```

Analogia de la vida real:

```text
Producto: iPhone 15 Pro
Categoria o linea de producto: Smartphones
Proveedor: Apple
Precio de compra: lo que la tienda paga a Apple
MSRP: precio sugerido de venta
Stock: cuantos hay disponibles
```

## Clientes

Un cliente es una empresa o persona que compra al negocio.

La tabla `customers` almacena:

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

Ejemplo:

| customerNumber | customerName | country | creditLimit |
| --- | --- | --- | --- |
| 103 | Atelier graphique | France | 21000.00 |

Significado:

```text
Atelier graphique es un cliente en Francia.
Tiene un limite de credito de 21,000.
Puede tener un representante de ventas asignado.
```

## Pedidos

Un pedido es una compra hecha por un cliente.

La idea importante es que un pedido tiene dos niveles:

```text
Cabecera del pedido
Detalles del pedido o lineas de pedido
```

Ejemplo de recibo de la vida real:

```text
Pedido #10100
Cliente: Atelier graphique
Fecha: 2003-01-06
Estado: Shipped

Items:
  1. 30 unidades de 1917 Grand Touring Sedan a 136.00 cada una
  2. 50 unidades de 1911 Ford Town Car a 55.09 cada una
  3. 22 unidades de 1932 Alfa Romeo a 75.46 cada una
```

La tabla `orders` almacena la cabecera del pedido.

Ejemplo:

| orderNumber | orderDate | status | customerNumber |
| --- | --- | --- | --- |
| 10100 | 2003-01-06 | Shipped | 363 |

La tabla `orderdetails` almacena los productos individuales dentro de ese pedido.

Ejemplo:

| orderNumber | productCode | quantityOrdered | priceEach |
| --- | --- | --- | --- |
| 10100 | S18_1749 | 30 | 136.00 |
| 10100 | S18_2248 | 50 | 55.09 |
| 10100 | S18_4409 | 22 | 75.46 |

Entonces:

```text
Un cliente puede tener muchos pedidos.
Un pedido puede tener muchos detalles de pedido.
Un detalle de pedido apunta a un producto.
```

## Por Que Pedidos y Detalles de Pedido Estan Separados

Un pedido puede contener varios productos.

Si todo estuviera guardado en una sola tabla, la misma informacion del pedido se repetiria una y otra vez.

Ejemplo:

| orderNumber | orderDate | customer | product | quantity |
| --- | --- | --- | --- | --- |
| 10100 | 2003-01-06 | Atelier graphique | Product A | 30 |
| 10100 | 2003-01-06 | Atelier graphique | Product B | 50 |
| 10100 | 2003-01-06 | Atelier graphique | Product C | 22 |

Observa como `orderDate` y `customer` se repiten.

Las bases de datos evitan repeticion innecesaria separando los datos:

```text
orders
  almacena informacion del pedido una sola vez

orderdetails
  almacena cada linea de producto dentro del pedido
```

Esto se llama normalizacion.

## Pagos

La tabla `payments` almacena dinero recibido de los clientes.

Ejemplo:

| customerNumber | checkNumber | paymentDate | amount |
| --- | --- | --- | --- |
| 103 | HQ336336 | 2004-10-19 | 6066.78 |

Significado:

```text
El cliente 103 hizo un pago de 6,066.78 usando el cheque HQ336336.
```

Detalle importante:

```text
Los pagos estan conectados a clientes, no directamente a pedidos.
```

Entonces la base de datos puede responder facilmente:

```text
Cuanto ha pagado este cliente en total?
```

Pero relacionar un pago con un pedido exacto no esta modelado directamente aqui.

## Empleados y Oficinas

La empresa tiene empleados que trabajan desde oficinas.

La tabla `offices` almacena ubicaciones de oficinas.

Ejemplo:

| officeCode | city | country |
| --- | --- | --- |
| 1 | San Francisco | USA |
| 4 | Paris | France |

La tabla `employees` almacena informacion del personal.

Ejemplo:

| employeeNumber | firstName | lastName | officeCode | jobTitle |
| --- | --- | --- | --- | --- |
| 1370 | Gerard | Hernandez | 4 | Sales Rep |

Los clientes pueden estar asignados a empleados:

```text
customers.salesRepEmployeeNumber -> employees.employeeNumber
```

Significado en la vida real:

```text
Un cliente es gestionado por un representante de ventas especifico.
Ese representante de ventas trabaja en una oficina.
```

## Mapa Mental de la Base de Datos Fuente

La base de datos operacional cuenta esta historia:

```text
Los empleados trabajan en oficinas.
Los empleados gestionan clientes.
Los clientes hacen pedidos.
Los pedidos contienen productos.
Los productos pertenecen a lineas de producto.
Los clientes hacen pagos.
```

Mapa simple de relaciones:

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

## Tablas Fuente Principales

| Tabla | Que almacena | Clave primaria |
| --- | --- | --- |
| `productlines` | Categorias de productos | `productLine` |
| `products` | Productos, proveedor, stock, precio de compra, MSRP | `productCode` |
| `offices` | Ubicaciones de oficinas | `officeCode` |
| `employees` | Personal, oficina, jefe directo | `employeeNumber` |
| `customers` | Perfil del cliente, ubicacion, representante de ventas, limite de credito | `customerNumber` |
| `payments` | Pagos de clientes | `customerNumber` + `checkNumber` |
| `orders` | Cabecera del pedido: fechas, estado, cliente | `orderNumber` |
| `orderdetails` | Lineas del pedido: producto, cantidad, precio | `orderNumber` + `productCode` |

## Por Que Convertir la Base de Datos a Parquet

La base de datos MySQL es buena para operaciones diarias:

```text
Crear un cliente
Actualizar el estado de un pedido
Registrar un pago
Revisar stock de productos
Asignar un representante de ventas
```

Pero los dashboards normalmente hacen preguntas analiticas:

```text
Que lineas de producto generan mas ingresos?
Que paises venden mas?
Que productos son mas rentables?
Que clientes compran mas?
Cuantos ingresos hicimos por mes?
```

Para responder esas preguntas desde la base original en MySQL, se necesitan muchos joins.

Pregunta de ejemplo:

```text
Ingresos por linea de producto
```

Para responderla desde MySQL, la consulta necesita este camino:

```text
orders
  -> orderdetails
    -> products
      -> productlines
```

Eso es correcto, pero repetitivo para trabajo de dashboard.

El ETL crea tablas analiticas mas faciles de usar y las guarda como archivos Parquet.

## Que Significa ETL

ETL significa:

```text
Extract: leer desde MySQL
Transform: reestructurar y unir los datos
Load: escribir archivos Parquet
```

En este proyecto:

```text
MySQL classicmodels
  -> Python ETL
    -> Archivos Parquet
      -> Dashboard en DuckDB/Jupyter
```

Los archivos Parquet finales son:

```text
dim_customers
dim_products
dim_locations
fact_orders
```

## Dimensiones y Hechos

Este es uno de los conceptos mas importantes de analitica en el laboratorio.

Una dimension describe algo.

Ejemplos:

```text
Cliente
Producto
Ubicacion
Fecha
Empleado
```

Un hecho registra algo que ocurrio.

Ejemplos:

```text
Ocurrio una linea de pedido.
Ocurrio un pago.
Ocurrio un envio.
Ocurrio una venta.
```

En este proyecto:

```text
dim_products describe productos.
dim_customers describe clientes.
dim_locations describe lugares.
fact_orders registra ventas/lineas de pedido.
```

Analogia simple:

```text
Hecho: Maria compro 2 cafes por 5 cada uno.

Dimensiones:
  Cliente: Maria
  Producto: Cafe
  Ubicacion: Lima
  Fecha: Lunes
```

El hecho contiene el evento numerico del negocio:

```text
cantidad = 2
precio = 5
monto = 10
```

Las dimensiones explican el contexto:

```text
quien, que, donde, cuando
```

## Tablas Analiticas en Parquet

El ETL crea un pequeno esquema estrella.

```text
             dim_customers
                  |
dim_products - fact_orders - dim_locations
```

## `dim_customers`

Esta tabla viene de `customers`.

Conserva identidad del cliente, contacto, direccion y campos de cuenta.

Columnas utiles:

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

Ejemplo de uso:

```text
Une fact_orders con dim_customers cuando quieras ventas por cliente.
```

## `dim_products`

Esta tabla viene de `products` unido con `productlines`.

Da detalles del producto y tambien la descripcion de la linea de producto.

Columnas utiles:

```text
productCode
productName
productLine
productScale
productVendor
productDescription
productLineDescription
```

Ejemplo de uso:

```text
Une fact_orders con dim_products cuando quieras ventas por producto o por linea de producto.
```

## `dim_locations`

Esta tabla viene de ubicaciones distintas de clientes en `customers`.

Columnas utiles:

```text
postalCode
city
state
country
```

Ejemplo de uso:

```text
Une fact_orders con dim_locations cuando quieras ventas por ciudad, estado o pais.
```

## `fact_orders`

Esta es la tabla analitica principal.

Una fila representa una linea de pedido.

Eso significa un producto dentro de un pedido.

Columnas utiles:

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

Fila de ejemplo:

| orderNumber | productCode | customerNumber | quantityOrdered | priceEach | orderAmount |
| --- | --- | --- | --- | --- | --- |
| 10100 | S18_1749 | 363 | 30 | 136.00 | 4080.00 |

El ETL calcula:

```text
orderAmount = quantityOrdered * priceEach
```

Entonces:

```text
30 * 136.00 = 4080.00
```

Por eso los dashboards pueden usar facilmente:

```sql
SUM(orderAmount)
```

para calcular ingresos.

## Como `fact_orders` se Conecta con las Dimensiones

La tabla de hechos mantiene IDs como:

```text
customerNumber
productCode
postalCode
```

Esos IDs conectan con tablas de dimension:

```text
fact_orders.customerNumber -> dim_customers.customerNumber
fact_orders.productCode -> dim_products.productCode
fact_orders.postalCode -> dim_locations.postalCode
```

Si `fact_orders` dice:

```text
productCode = S18_1749
customerNumber = 363
postalCode = 44000
orderAmount = 4080
```

Unes dimensiones para entenderlo:

```text
S18_1749 = 1917 Grand Touring Sedan
363 = Dragon Souveniers, Ltd.
44000 = Nantes, France
```

## Ejemplo Real de Dashboard

Pregunta de negocio:

```text
Que lineas de producto generaron mas dinero?
```

Necesario desde `fact_orders`:

```text
orderAmount
productCode
```

Necesario desde `dim_products`:

```text
productName
productLine
```

Consulta:

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

Traduccion en lenguaje simple:

```text
Toma cada linea de venta.
Encuentra el producto de esa linea de venta.
Busca la categoria del producto.
Suma todos los montos de venta por categoria.
Muestra primero las categorias mas grandes.
```

## Donde se Guardan los Archivos Parquet

Ruta local:

```text
warehouse/dim_customers/dim_customers.parquet
warehouse/dim_products/dim_products.parquet
warehouse/dim_locations/dim_locations.parquet
warehouse/fact_orders/fact_orders.parquet
```

Ruta MinIO/S3:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

## Modelo Mental Progresivo

Empieza con esto:

```text
Linea de producto = categoria
Producto = articulo que se vende
Cliente = comprador
Pedido = compra
Detalle de pedido = un producto dentro de la compra
Pago = dinero recibido
Empleado = representante de ventas
Oficina = donde trabaja el empleado
```

Luego pasa a esto:

```text
Base operacional = muchas tablas normalizadas para operar el negocio
Parquet analitico = menos tablas reestructuradas para responder preguntas de negocio
```

Finalmente:

```text
Las dimensiones describen cosas.
Los hechos registran eventos y numeros.
Los dashboards unen hechos con dimensiones.
```

Ese es el corazon de este proyecto.

