#[cfg(test)]
mod tests {
    // ==================== PRICE VALIDATION ====================
    fn validate_price(price: f64) -> Result<(), &'static str> {
        if price < 0.0 { return Err("Price cannot be negative") }
        if price > 999_999.99 { return Err("Price exceeds maximum") }
        Ok(())
    }

    fn validate_stock(stock: i32) -> Result<(), &'static str> {
        if stock < 0 { return Err("Stock cannot be negative") }
        if stock > 99_999 { return Err("Stock exceeds maximum") }
        Ok(())
    }

    fn is_valid_slug(slug: &str) -> bool {
        !slug.is_empty()
            && slug.len() <= 200
            && slug.chars().all(|c| c.is_alphanumeric() || c == '-')
            && !slug.starts_with('-')
            && !slug.ends_with('-')
    }

    fn calculate_discount_price(price: f64, pct: f64) -> f64 {
        let discounted = price * (1.0 - pct / 100.0);
        (discounted * 100.0).round() / 100.0
    }

    fn is_valid_email(email: &str) -> bool {
        let parts: Vec<&str> = email.splitn(2, '@').collect();
        parts.len() == 2 && !parts[0].is_empty() && parts[1].contains('.')
    }

    // ==================== PRICE TESTS ====================
    #[test] fn price_zero_ok()         { assert!(validate_price(0.0).is_ok()); }
    #[test] fn price_positive_ok()     { assert!(validate_price(99.99).is_ok()); }
    #[test] fn price_negative_err()    { assert!(validate_price(-1.0).is_err()); }
    #[test] fn price_max_ok()          { assert!(validate_price(999_999.99).is_ok()); }
    #[test] fn price_over_max_err()    { assert!(validate_price(1_000_000.0).is_err()); }

    // ==================== STOCK TESTS ====================
    #[test] fn stock_zero_ok()         { assert!(validate_stock(0).is_ok()); }
    #[test] fn stock_positive_ok()     { assert!(validate_stock(100).is_ok()); }
    #[test] fn stock_negative_err()    { assert!(validate_stock(-1).is_err()); }
    #[test] fn stock_max_ok()          { assert!(validate_stock(99_999).is_ok()); }
    #[test] fn stock_over_max_err()    { assert!(validate_stock(100_000).is_err()); }

    // ==================== SLUG TESTS ====================
    #[test] fn slug_valid()            { assert!(is_valid_slug("camiseta-azul-xl")); }
    #[test] fn slug_numbers_ok()       { assert!(is_valid_slug("producto-123")); }
    #[test] fn slug_empty_err()        { assert!(!is_valid_slug("")); }
    #[test] fn slug_spaces_err()       { assert!(!is_valid_slug("mi producto")); }
    #[test] fn slug_leading_dash_err() { assert!(!is_valid_slug("-producto")); }
    #[test] fn slug_trailing_dash_err(){ assert!(!is_valid_slug("producto-")); }
    #[test] fn slug_special_err()      { assert!(!is_valid_slug("prod@uct!")); }
    #[test] fn slug_too_long_err()     { assert!(!is_valid_slug(&"a".repeat(201))); }
    #[test] fn slug_max_len_ok()       { assert!(is_valid_slug(&"a".repeat(200))); }

    // ==================== DISCOUNT TESTS ====================
    #[test] fn discount_10_pct()       { assert_eq!(calculate_discount_price(100.0, 10.0), 90.0); }
    #[test] fn discount_50_pct()       { assert_eq!(calculate_discount_price(200.0, 50.0), 100.0); }
    #[test] fn discount_0_pct()        { assert_eq!(calculate_discount_price(50.0, 0.0), 50.0); }
    #[test] fn discount_100_pct()      { assert_eq!(calculate_discount_price(75.0, 100.0), 0.0); }
    #[test] fn discount_rounding()     { assert_eq!(calculate_discount_price(9.99, 10.0), 8.99); }
    #[test] fn discount_odd_price()    { assert_eq!(calculate_discount_price(33.33, 33.0), 22.33); }

    // ==================== EMAIL TESTS ====================
    #[test] fn email_valid()           { assert!(is_valid_email("user@example.com")); }
    #[test] fn email_subdomain_ok()    { assert!(is_valid_email("u@mail.co.uk")); }
    #[test] fn email_no_at_err()       { assert!(!is_valid_email("userexample.com")); }
    #[test] fn email_no_dot_err()      { assert!(!is_valid_email("user@example")); }
    #[test] fn email_empty_local_err() { assert!(!is_valid_email("@example.com")); }
    #[test] fn email_empty_err()       { assert!(!is_valid_email("")); }
}
