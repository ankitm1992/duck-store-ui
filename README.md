# Duck Store

*  Backend: Java 21, Spring Boot 4, Spring Data JPA, PostgreSQL 16, Flyway
*  Frontend: Angular 21 (standalone components, reactive forms)

## Run locally with Docker
### Prerequisites :
```bash
   1.Install docker
   2.Clone below repositories from git,
      > https://github.com/ankitm1992/duck-store-service.git
      > https://github.com/ankitm1992/duck-store-ui.git
```
### Run below commands :
```bash
   docker network create duckstore-net
   cd duck-store-service
   docker compose up --build -d
```
After running above command, backend service will be available at  following endpoint,

* API: http://localhost:8080/api/

```bash
   cd duck-store-ui
   docker compose up --build -d
```

After running above command, frontend will be available at following endpoint,

* UI: http://localhost:4200/


## API

| Method | Path                                                                        | Notes                                                                                                                 | Sample Curl                                                                                     
|---|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| GET | `/api/warehouse/listDucks?page=0&size=10&sortBy=quantity&sortDir=ASC\|DESC` | live ducks sorted by quantity (default desc)                                                                          | curl --location 'localhost:8080/api/warehouse/listDucks?page=0&size=10&sortBy=quantity&sortDir=DESC' |
| POST | `/api/warehouse/addDucks`                                                   | add duck with`{color,size,price,quantity}`; returns **201** if created, **200** if merged into an existing duck entry | curl --location 'localhost:8080/api/warehouse/addDucks' --header 'Content-Type: application/json' --data '{"color": "Black", "size": "Medium", "price": 12.99, "quantity": 5}'                                                                                         |
| PUT | `/api/warehouse/update/{id}`                                                | update duck with`{price,quantity}` only, returns 200                                                                  | curl --location --request PUT 'localhost:8080/api/warehouse/update/7' --header 'Content-Type: application/json' --data '{"price": 17, "quantity": 1000}'                                                                                         |
| DELETE | `/api/warehouse/delete/{id}`                                                | delete by id, returns 204                                                                                             | curl --location --request DELETE 'localhost:8080/api/warehouse/delete/1'                                                                                         |
| POST | `/api/orders`                                                               | returns package, protections, unit price, total, breakdown                                                            | curl --location 'localhost:8080/api/orders' --header 'Content-Type: application/json' --data '{"color": "Yellow", "size": "Medium", "quantity": 10, "country": "USA", "shippingMode": "Air"}'                                                                                         |

Enum values are case-insensitive (`Red`, `XLarge`, `Land|Air|Sea`). Errors are `{message, details}` with 400 (validation), 404, 409.

## Design

`Warehouse` (CRUD + merge invariant), `Store` (order orchestration),
`Packaging` (Strategy per shipping mode + size - > package resolver), `Pricing`
(Chain of `PricingRule` beans, one per rule family), `common` (exceptions).
`OrderService` only orchestrates; adding a shipping mode or pricing rule means adding a class, not editing a conditional chain.

### Concurrency of the merge rule :
Enforced in the database, not in application code:
* Flyway migration `V1__create_ducks.sql` creates a **partial unique index** on `(color, size, price) WHERE deleted = FALSE`. Logically deleted rows stay in the table but never block a new identical duck.
* Add = one atomic `INSERT ... ON CONFLICT (...) WHERE deleted = FALSE DO UPDATE SET quantity = ducks.quantity + EXCLUDED.quantity RETURNING id, (xmax = 0)`. Concurrent adds serialize on the row: no lost updates, no duplicates, no retry loop. `xmax = 0` tells us whether the row was inserted (201) or merged (200).

### Decisions on ambiguity :
* **Order price resolution**: among live ducks of the requested color + size whose single record holds enough stock for the *whole* order, the **cheapest** price is used. No such record: 404 if the warehouse has no such duck at all, 409 if stock is insufficient. Orders are quotes: **stock is not decremented** (not requested).
* **Price type**: stored as `NUMERIC(10,2)` / `BigDecimal` rather than `Double` so money math is exact to the cent. Max 2 decimals accepted (otherwise 400); price must be >= 0.01.
* **Merge when editing**: if an edit would make a duck identical (color, size, price) to another live duck, the edit is rejected with 409 rather than silently merging.
* **Quantity**: add requires >= 1; edit allows 0 (sold out). Sorting by quantity defaults to descending; click the header to toggle.
* **Deleting** an already deleted/unknown duck -> 404. Adding the same duck after deleting creates a new record (the deleted one is not resurrected).
* **Percentages apply to the base cost** (quantity x unit price), each independently, as the rules literally say "of the total cost". They are *not* compounded on a running total. Each line is rounded half-up to cents and the total is the sum of the rounded lines, so the breakdown always adds up exactly.
* **Country**: matched case/whitespace-insensitively; "US" and "United States" are treated as USA. Anything else gets the 15% default.
* Schema is managed by Flyway; Hibernate only validates it (`ddl-auto=validate`).
