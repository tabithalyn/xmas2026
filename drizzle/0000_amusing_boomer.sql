CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"store" varchar NOT NULL,
	"preferences" varchar,
	"price" integer NOT NULL,
	"link" varchar NOT NULL
);
