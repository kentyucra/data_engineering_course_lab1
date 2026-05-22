# Laboratorio de Ciclo de Vida de Data Engineering con Docker Local

Esta guía explica cómo ejecutar el laboratorio completo de data engineering en cualquier máquina con Docker corriendo localmente.

El proyecto demuestra un flujo de datos realista:

```text
App operacional + MySQL -> ETL -> almacenamiento de objetos MinIO -> consultas DuckDB -> dashboard en Jupyter
```

![Diagrama de diseno del sistema](docs/system-design.es.svg)

El stack local usa:

- **MySQL** como base de datos operacional de origen.
- **Frontend en Next.js** como una pequeña aplicación interna de operaciones que interactúa con MySQL.
- **ETL en Python** para transformar datos operacionales normalizados en archivos Parquet analíticos.
- **MinIO** como almacenamiento local compatible con S3.
- **DuckDB** como motor SQL sobre archivos Parquet.
- **Jupyter Lab** como ambiente de análisis y dashboard.
- **Docker Compose** para ejecutar cada servicio.

## 1. Prerrequisitos

Instala Docker u otro runtime compatible con Docker.

En Linux, agrega tu usuario al grupo `docker` para poder ejecutar Docker sin `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Si usas Colima como runtime local de Docker, inícialo antes de ejecutar comandos Docker:

```bash
brew install colima docker docker-compose
colima start --cpu 2 --memory 4 --disk 20
docker context use colima
```

Verifica Docker:

```bash
docker --version
docker-compose --version
docker ps
```

Si tu ambiente soporta el plugin nuevo de Docker Compose, puedes usar `docker compose` en lugar de `docker-compose`.

Clona este repositorio y entra a la carpeta del proyecto:

```bash
git clone https://github.com/kentyucra/data_engineering_course_lab1.git
cd data_engineering_course_lab1
```

## 2. Iniciar la Base de Datos de Origen

El sistema de origen es la base de datos MySQL `classicmodels`. Representa una tienda que vende modelos a escala de autos clásicos y otros vehículos.

Inicia MySQL:

```bash
cd db
docker-compose up -d --build
```

Conéctate a la base de datos:

```bash
docker exec -it classicmodels-mysql mysql -uadmin -padminpwrd classicmodels
```

Explora las tablas:

```sql
SHOW TABLES;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM orderdetails;
EXIT;
```

Deberías ver tablas como:

- `customers`
- `employees`
- `offices`
- `orderdetails`
- `orders`
- `payments`
- `productlines`
- `products`

Más detalles en:

```text
db/README.md
db/README.es.md
```

## 3. Iniciar el Frontend de Operaciones

El frontend ayuda a los estudiantes a entender cómo una aplicación operacional real podría usar la base de datos.

Muestra clientes, órdenes, productos, empleados, reportes y una página de esquema.

Inicia el frontend con Docker Compose:

```bash
cd frontend
docker-compose up -d --build
```

Abrir:

```text
http://localhost:3000
```

Desde otra computadora en la misma red local, usa la IP de la máquina host:

```text
http://SERVER_IP:3000
```

El frontend lee y escribe en MySQL. Esta es la parte operacional del sistema.

Más detalles en:

```text
frontend/README.md
frontend/README.es.md
```

## 4. Iniciar MinIO como Almacenamiento de Objetos

MinIO es almacenamiento local compatible con S3. Guarda los archivos Parquet transformados por el paso de ETL.

Inicia MinIO:

```bash
cd min_io
docker-compose up -d
```

Abre la consola de MinIO:

```text
http://localhost:9001
```

Credenciales:

```text
Username: minioadmin
Password: minioadmin
```

La configuración crea este bucket:

```text
classicmodels
```

El endpoint de la API compatible con S3 es:

```text
http://localhost:9000
```

Más detalles en:

```text
min_io/README.md
min_io/README.es.md
```

## 5. Ejecutar el Job ETL

ETL significa **Extract, Transform, Load**:

- **Extract:** leer datos de origen desde MySQL.
- **Transform:** convertir tablas operacionales normalizadas en tablas analíticas.
- **Load:** escribir los datos transformados como archivos Parquet en MinIO.

Ejecuta el contenedor ETL de una sola corrida:

```bash
cd etl
docker-compose up --build
```

El contenedor termina cuando finaliza el ETL.

Escribe:

```text
s3://classicmodels/warehouse/dim_customers/dim_customers.parquet
s3://classicmodels/warehouse/dim_products/dim_products.parquet
s3://classicmodels/warehouse/dim_locations/dim_locations.parquet
s3://classicmodels/warehouse/fact_orders/fact_orders.parquet
```

Puedes inspeccionar esos archivos en MinIO:

```text
http://localhost:9001
```

El ETL actualmente se comporta como un full refresh. Si lo ejecutas varias veces, la corrida más reciente reemplaza los mismos objetos Parquet. No agrega filas duplicadas ni crea una carpeta nueva por cada corrida.

Más detalles en:

```text
etl/README.md
etl/README.es.md
```

## 6. Ejecutar el Dashboard en Jupyter

El dashboard usa la librería de DuckDB para Python para consultar archivos Parquet desde MinIO, y luego crea gráficos con Pandas, Seaborn, Matplotlib e ipywidgets.

No necesitas instalar DuckDB directamente en tu máquina. DuckDB corre dentro del contenedor Docker de Jupyter.

Un modelo mental útil:

```text
MinIO = donde viven los archivos analíticos
DuckDB = el motor SQL que lee esos archivos
```

DuckDB no reemplaza a MySQL. MySQL es la base de datos operacional de origen. DuckDB consulta los archivos Parquet analíticos transformados.

Inicia Jupyter:

```bash
cd dashboard
docker-compose up -d --build
```

Abrir:

```text
http://localhost:8888/lab?token=classicmodels
```

Abre este notebook:

```text
classicmodels_dashboard_duckdb.ipynb
```

El flujo del dashboard es:

```text
Jupyter Notebook -> DuckDB -> archivos Parquet en MinIO -> gráficos/dashboard
```

Más detalles en:

```text
dashboard/README.md
dashboard/README.es.md
```

## 7. Detener Servicios

Detén cada servicio desde su carpeta:

```bash
cd frontend
docker-compose down
```

```bash
cd dashboard
docker-compose down
```

```bash
cd etl
docker-compose down
```

```bash
cd min_io
docker-compose down
```

```bash
cd db
docker-compose down
```

Para borrar datos almacenados de MySQL o MinIO, usa `-v` con el proyecto Compose correspondiente:

```bash
docker-compose down -v
```

Usa esto con cuidado porque elimina los volúmenes locales de Docker.

## 8. Troubleshooting

### El comando Docker Compose no funciona

Si esto falla:

```bash
docker compose up -d
```

usa:

```bash
docker-compose up -d
```

Si tu configuración de Docker no soporta el plugin nuevo de Compose, usa el comando legacy `docker-compose`.

### MySQL no responde

Verifica que el contenedor de la base de datos esté corriendo:

```bash
docker ps
```

Revisa logs:

```bash
docker logs classicmodels-mysql
```

### MinIO no responde

Verifica:

```bash
docker ps
docker logs classicmodels-minio
```

Abrir:

```text
http://localhost:9001
```

### El ETL no puede conectarse a MySQL o MinIO

El contenedor ETL debe poder unirse a ambas redes de Docker:

```text
db_default
min_io_default
```

Revisa las redes:

```bash
docker network ls
```

Asegúrate de que MySQL y MinIO ya estén corriendo antes de iniciar el ETL.

### Jupyter no puede consultar MinIO

Dentro del contenedor de Jupyter, el endpoint de MinIO es:

```text
classicmodels-minio:9000
```

Desde tu máquina host, el endpoint de MinIO es:

```text
localhost:9000
```

El notebook del dashboard lee `S3_ENDPOINT` desde el ambiente, así que Docker Compose configura esto automáticamente.

## 9. Qué Construiste

Al final, tienes un ciclo de vida completo de data engineering en local:

1. **Base de datos operacional:** MySQL almacena datos transaccionales de origen.
2. **App operacional:** el frontend en Next.js interactúa con MySQL.
3. **ETL:** Python extrae, transforma y carga datos.
4. **Almacenamiento de objetos:** MinIO guarda archivos Parquet transformados.
5. **Motor de consulta:** DuckDB consulta Parquet directamente desde almacenamiento de objetos.
6. **Dashboard:** Jupyter visualiza los resultados de las consultas.
