# ShopSphere — E-commerce Prototype

A client-review prototype using React + TypeScript + Vite, ASP.NET Core 8 Web API, EF Core, and PostgreSQL.

## Included in this starter
- React storefront with product listing, search, login/register UI, cart state, and protected-route foundation
- ASP.NET Core API with Clean Architecture-inspired separation (API, Application, Domain, Infrastructure)
- ASP.NET Core Identity/JWT authentication foundation
- PostgreSQL via EF Core/Npgsql
- Product API and demo seed data
- Docker Compose for PostgreSQL

> This is a starter prototype, not a production-ready commerce system. Before sharing publicly, review security, add tests, configure secrets, and complete checkout/order workflows.

## Requirements
- .NET 8 SDK
- Node.js 20+
- Docker Desktop (or a PostgreSQL instance)

## Start PostgreSQL
From the repository root:
```bash
docker compose up -d
```

## Run the API
```bash
cd server/ShopSphere.Api
dotnet restore
dotnet run
```
The API reads `ConnectionStrings:DefaultConnection` and `Jwt:Key` from environment variables or `appsettings.Development.json`. Replace development values before deployment.
Swagger is available in Development mode at the URL printed by `dotnet run`.

## Run the frontend
```bash
cd client
npm install
npm run dev
```
The frontend uses `VITE_API_URL` (default `http://localhost:5080/api`).

## Important before client demo
- Create separate demo customer/admin accounts using a controlled provisioning flow.
- Do not expose an open public admin-registration endpoint.
- Use HTTPS and a secret manager for deployment.
- Configure allowed CORS origins for the deployed frontend.
- Add order transaction/stock concurrency protection, tests, and production-grade token handling before production use.
