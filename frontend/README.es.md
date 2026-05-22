# Frontend de Operaciones Classic Models

Esta es una pequeña aplicación interna de operaciones para la base de datos MySQL `classicmodels`.

Está construida intencionalmente como una herramienta de negocio real: los empleados pueden explorar clientes, órdenes, productos, responsables internos y reportes livianos respaldados por consultas SQL sobre la base de datos normalizada.

## Ejecutar Localmente

Asegúrate de que el contenedor de la base de datos esté corriendo desde la carpeta `db`:

```bash
cd ../db
docker-compose up -d --build
```

Instala y ejecuta el frontend:

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Abrir:

```text
http://localhost:3000
```

## Ejecutar con Docker

Con el contenedor MySQL ya corriendo desde `db/`, construye e inicia el frontend:

```bash
cd frontend
docker-compose up -d --build
```

Abrir:

```text
http://localhost:3000
```

En macOS con Colima, la configuración Docker usa `host.docker.internal` para alcanzar el puerto MySQL expuesto por el contenedor de base de datos.

## Configuración de Base de Datos

La app espera:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=adminpwrd
DB_NAME=classicmodels
```

## Por Qué Existe

Antes de que los estudiantes construyan un pipeline ETL, esta app muestra el lado operacional del sistema:

1. Los usuarios interactúan con una aplicación de negocio.
2. La aplicación lee y escribe en tablas MySQL normalizadas.
3. Los esquemas operacionales son buenos para transacciones.
4. Las preguntas analíticas requieren joins y agregaciones.
5. El pipeline de data engineering luego remodela estos datos para facilitar el análisis.
