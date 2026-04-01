ALTER TABLE products
    ALTER COLUMN price         TYPE FLOAT8 USING price::float8,
    ALTER COLUMN compare_price TYPE FLOAT8 USING compare_price::float8,
    ALTER COLUMN cost_price    TYPE FLOAT8 USING cost_price::float8,
    ALTER COLUMN weight        TYPE FLOAT8 USING weight::float8;

ALTER TABLE product_variants
    ALTER COLUMN price TYPE FLOAT8 USING price::float8;
