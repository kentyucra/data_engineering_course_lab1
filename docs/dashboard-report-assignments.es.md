# Asignaciones de Reportes para el Dashboard

Este documento entrega a cada grupo de estudiantes una tarea analitica de dificultad media a alta para construir dentro del notebook de dashboard en Jupyter.

El objetivo es practicar como analistas y data engineers usan un data lake transformado: consultar archivos Parquet desde MinIO con DuckDB, crear DataFrames y convertir los resultados en reportes de negocio utiles.

## Configuracion de Clase

Hay 30 estudiantes divididos en 5 grupos de 6 estudiantes.

Cada grupo debe crear su propia copia del notebook antes de empezar:

```text
classicmodels_dashboard_group_1.ipynb
classicmodels_dashboard_group_2.ipynb
classicmodels_dashboard_group_3.ipynb
classicmodels_dashboard_group_4.ipynb
classicmodels_dashboard_group_5.ipynb
```

Todos los grupos usan los mismos datos analiticos en MinIO:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

## Tablas Disponibles

### `fact_orders`

Tabla principal de hechos analiticos. Una fila representa una linea de una orden.

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

### `dim_customers`

Dimension de clientes.

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

### `dim_products`

Dimension de productos.

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

### `dim_locations`

Dimension de ubicaciones de clientes.

Columnas utiles:

```text
postalCode
city
state
country
```

## Patron Comun de Consulta

Cada grupo puede empezar con este patron dentro del notebook:

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

Los grupos deben crear consultas SQL nuevas, no solamente reutilizar las celdas existentes del dashboard.

## Entregables Requeridos

Cada grupo debe entregar:

1. Una copia del notebook con un nombre claro del grupo.
2. Al menos 3 consultas SQL nuevas usando DuckDB.
3. Al menos 2 graficos nuevos.
4. Al menos 1 tabla ranking o reporte de excepciones.
5. Una interpretacion escrita corta para cada grafico o tabla.
6. Una recomendacion final de negocio basada en el analisis.

## Grupo 1: Rendimiento de Ventas y Concentracion de Ingresos

Pregunta de negocio:

Que productos, lineas de producto y clientes generan mas ingresos, y esta el negocio demasiado concentrado en pocas areas?

Reportes sugeridos:

1. **Ingresos por linea de producto**
   - Tipo de grafico: grafico de barras horizontal.
   - Columnas: `productLine`, total de `orderAmount`.
   - Agregar porcentaje del ingreso total.

2. **Top 15 productos por ingresos**
   - Tipo de salida: tabla ranking.
   - Columnas: `productName`, `productLine`, ingresos totales, cantidad total, precio promedio de venta.
   - Dificultad: incluir ingresos y volumen para que los estudiantes expliquen productos de alto precio vs productos de alto volumen.

3. **Concentracion de ingresos por cliente**
   - Tipo de grafico: grafico Pareto o linea de porcentaje acumulado.
   - Columnas: `customerName`, ingresos, porcentaje acumulado de ingresos.
   - Pregunta: cuantos clientes generan el 50 por ciento o el 80 por ciento de los ingresos?

4. **Ingresos por proveedor de producto**
   - Tipo de grafico: grafico de barras.
   - Columnas: `productVendor`, ingresos totales, productos distintos vendidos.
   - Pregunta: que proveedores son mas importantes de proteger?

5. **Tabla ejecutiva de resumen**
   - Tipo de salida: tabla KPI de una fila.
   - Incluir ingresos totales, ordenes totales, clientes totales, productos vendidos totales y valor promedio por linea de orden.

Reto medio a dificil:

Crear un reporte de concentracion de clientes estilo Pareto usando una funcion de ventana:

```sql
SUM(customer_revenue) OVER (ORDER BY customer_revenue DESC)
```

## Grupo 2: Geografia, Mercados y Oportunidad Regional

Pregunta de negocio:

Que paises y ciudades son mas fuertes, y donde podria tener oportunidades de crecimiento la empresa?

Reportes sugeridos:

1. **Ingresos por pais**
   - Tipo de grafico: grafico de barras ordenado.
   - Columnas: `country`, ingresos totales, numero de clientes, numero de ordenes.

2. **Ingreso promedio por cliente por pais**
   - Tipo de grafico: grafico de barras.
   - Columnas: `country`, ingreso por cliente.
   - Filtro: paises con al menos 2 clientes o 2 ordenes para evitar muestras pequenas enganosas.

3. **Principales ciudades por ingresos**
   - Tipo de salida: tabla ranking.
   - Columnas: `city`, `country`, ingresos, ordenes, clientes.

4. **Preferencia de linea de producto por pais**
   - Tipo de grafico: heatmap.
   - Filas: `country`.
   - Columnas: `productLine`.
   - Valores: ingresos.
   - Dificultad: limitar a los paises principales para que el heatmap sea legible.

5. **Mercados subdesarrollados**
   - Tipo de salida: tabla de excepciones.
   - Encontrar paises con alto valor promedio de orden pero bajo numero de clientes.
   - Pregunta: podrian ser oportunidades de expansion?

Reto medio a dificil:

Construir un ranking de paises que combine ranking de ingresos, ranking de cantidad de clientes y ranking de valor promedio de orden.

## Grupo 3: Rentabilidad, Margen y Precios

Pregunta de negocio:

Que productos y lineas de producto generan el margen bruto mas fuerte, y donde podria necesitar atencion la estrategia de precios?

Reportes sugeridos:

1. **Margen bruto por linea de producto**
   - Tipo de grafico: grafico de barras.
   - Formula:

```text
gross_margin = orderAmount - (quantityOrdered * buyPrice)
gross_margin_pct = gross_margin / orderAmount
```

2. **Productos mas rentables**
   - Tipo de salida: tabla ranking.
   - Columnas: `productName`, `productLine`, ingresos, margen bruto, porcentaje de margen bruto.

3. **Productos de bajo margen y altos ingresos**
   - Tipo de salida: tabla de excepciones.
   - Encontrar productos con ingresos altos pero porcentaje de margen por debajo del promedio.
   - Pregunta: son productos riesgosos o estrategicamente importantes?

4. **Precio de venta vs MSRP**
   - Tipo de grafico: scatter plot.
   - Eje X: `MSRP`.
   - Eje Y: promedio de `priceEach`.
   - Color: `productLine`.
   - Pregunta: que lineas de producto se venden mas cerca o mas lejos del MSRP?

5. **Reporte de presion de descuento**
   - Tipo de salida: tabla ranking.
   - Formula:

```text
discount_pct = (MSRP - priceEach) / MSRP
```

Reto medio a dificil:

Crear un scatter plot que compare ingresos y porcentaje de margen por producto, y luego etiquetar los 5 productos con mayores ingresos.

## Grupo 4: Operaciones, Envio y Estado de Ordenes

Pregunta de negocio:

Que tan saludable es el proceso de cumplimiento de ordenes, y donde aparecen retrasos o problemas de estado?

Reportes sugeridos:

1. **Distribucion de estados de orden**
   - Tipo de grafico: grafico de barras.
   - Columnas: `status`, conteo de `orderNumber` distintos, ingresos totales.

2. **Analisis de retrasos de envio**
   - Formula:

```text
days_to_ship = shippedDate - orderDate
shipping_delay = shippedDate - requiredDate
```

   - Tipo de grafico: histograma o box plot.
   - Pregunta: cuanto tiempo suele tomar el envio?

3. **Envios atrasados**
   - Tipo de salida: tabla de excepciones.
   - Filas donde `shippedDate > requiredDate`.
   - Columnas: numero de orden, cliente, pais, fecha requerida, fecha de envio, dias de atraso, valor de la orden.

4. **Retraso por pais**
   - Tipo de grafico: grafico de barras.
   - Columnas: `country`, promedio de dias para enviar, tasa de envios atrasados.
   - Dificultad: usar ordenes distintas para que las ordenes grandes con muchas lineas no se cuenten de mas.

5. **Valor de orden por estado**
   - Tipo de grafico: box plot.
   - Pregunta: las ordenes de alto valor tienen mas probabilidad de tener estados problematicos?

Reto medio a dificil:

Crear primero un reporte a nivel de orden y luego agregarlo. La tabla de hechos esta a nivel de linea de orden, asi que evita contar la misma orden varias veces al analizar envios.

## Grupo 5: Riesgo de Clientes, Limite de Credito y Calidad de Cuenta

Pregunta de negocio:

Que clientes parecen valiosos, riesgosos, subutilizados o merecen mas atencion del negocio?

Reportes sugeridos:

1. **Valor del cliente vs limite de credito**
   - Tipo de grafico: scatter plot.
   - Eje X: `creditLimit`.
   - Eje Y: ingresos totales.
   - Tamano: numero de ordenes.
   - Pregunta: que clientes compran muy por encima o por debajo de su limite de credito?

2. **Proxy de utilizacion de credito**
   - Tipo de salida: tabla ranking.
   - Formula:

```text
revenue_to_credit_ratio = total_revenue / creditLimit
```

   - Filtro: clientes con limite de credito no nulo y positivo.

3. **Clientes con alto credito y baja actividad**
   - Tipo de salida: tabla de excepciones.
   - Encontrar clientes con alto limite de credito pero bajos ingresos totales.
   - Pregunta: son oportunidades de venta perdidas?

4. **Frecuencia de ordenes por cliente**
   - Tipo de grafico: histograma.
   - Columnas: numero de ordenes distintas por cliente.
   - Pregunta: el negocio depende de clientes recurrentes o de compradores ocasionales?

5. **Segmentacion de clientes**
   - Tipo de salida: tabla y grafico.
   - Crear segmentos como:
     - alto valor / alta actividad
     - alto valor / baja actividad
     - bajo valor / alto credito
     - bajo valor / baja actividad

Reto medio a dificil:

Crear segmentos de clientes usando percentiles:

```sql
NTILE(4) OVER (ORDER BY total_revenue)
```

Luego comparar el comportamiento entre cuartiles.

## Retos Avanzados Opcionales

Estos pueden asignarse a grupos que terminen temprano.

1. **Tendencia temporal de ingresos**
   - Agrupar ingresos por mes usando `DATE_TRUNC('month', orderDate)`.
   - Graficar ingresos mensuales y numero de ordenes.

2. **Mix de productos a traves del tiempo**
   - Mostrar como cambian los ingresos por linea de producto por mes o trimestre.
   - Tipo de grafico: grafico de barras apiladas o grafico de lineas.

3. **Reporte de anomalias**
   - Encontrar lineas de orden inusualmente grandes.
   - Usar z-score o umbrales por percentil.

4. **Filtro reutilizable de dashboard**
   - Agregar un dropdown de `ipywidgets` para pais o linea de producto.
   - Actualizar graficos segun el valor seleccionado.

5. **Validaciones de calidad de datos**
   - Contar nulos en columnas clave.
   - Encontrar ordenes sin fecha de envio.
   - Encontrar productos con margen cero o negativo.

## Notas para Docencia

Problemas comunes a vigilar:

- La tabla de hechos esta a nivel de linea de orden, asi que los reportes a nivel de orden deben usar `COUNT(DISTINCT orderNumber)` o construir primero una subconsulta a nivel de orden.
- Los calculos de margen necesitan `quantityOrdered`, `buyPrice` y `orderAmount`.
- Los reportes geograficos requieren unir `fact_orders` con `dim_locations` usando `postalCode`.
- Los reportes de producto requieren unir `fact_orders` con `dim_products` usando `productCode`.
- Los reportes de cliente requieren unir `fact_orders` con `dim_customers` usando `customerNumber`.
- Los dashboards publicos deben evitar exponer credenciales sensibles o notebooks editables compartidos sin control de acceso.
