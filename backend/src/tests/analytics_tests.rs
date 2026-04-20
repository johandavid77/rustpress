#[cfg(test)]
mod tests {
    fn uptime_pct(up: usize, total: usize) -> f64 {
        if total == 0 { return 100.0; }
        (up as f64 / total as f64) * 100.0
    }

    fn revenue_growth(current: f64, previous: f64) -> f64 {
        if previous == 0.0 { return 0.0; }
        ((current - previous) / previous) * 100.0
    }

    fn clamp_page(page: i64, total_pages: i64) -> i64 {
        page.max(1).min(total_pages.max(1))
    }

    fn parse_period(s: &str) -> Option<u32> {
        match s { "7d" => Some(7), "30d" => Some(30), "90d" => Some(90), "1y" => Some(365), _ => None }
    }

    // ==================== UPTIME ====================
    #[test] fn uptime_all_up()         { assert_eq!(uptime_pct(100, 100), 100.0); }
    #[test] fn uptime_all_down()       { assert_eq!(uptime_pct(0, 100), 0.0); }
    #[test] fn uptime_half()           { assert_eq!(uptime_pct(50, 100), 50.0); }
    #[test] fn uptime_no_checks()      { assert_eq!(uptime_pct(0, 0), 100.0); }
    #[test] fn uptime_99()             { assert!((uptime_pct(99, 100) - 99.0).abs() < 0.001); }

    // ==================== REVENUE GROWTH ====================
    #[test] fn growth_positive()       { assert_eq!(revenue_growth(150.0, 100.0), 50.0); }
    #[test] fn growth_negative()       { assert_eq!(revenue_growth(50.0, 100.0), -50.0); }
    #[test] fn growth_zero_prev()      { assert_eq!(revenue_growth(100.0, 0.0), 0.0); }
    #[test] fn growth_same()           { assert_eq!(revenue_growth(100.0, 100.0), 0.0); }
    #[test] fn growth_double()         { assert_eq!(revenue_growth(200.0, 100.0), 100.0); }

    // ==================== PAGINATION ====================
    #[test] fn page_valid()            { assert_eq!(clamp_page(2, 5), 2); }
    #[test] fn page_below_min()        { assert_eq!(clamp_page(0, 5), 1); }
    #[test] fn page_above_max()        { assert_eq!(clamp_page(10, 5), 5); }
    #[test] fn page_no_pages()         { assert_eq!(clamp_page(1, 0), 1); }

    // ==================== PERIOD PARSING ====================
    #[test] fn period_7d()             { assert_eq!(parse_period("7d"), Some(7)); }
    #[test] fn period_30d()            { assert_eq!(parse_period("30d"), Some(30)); }
    #[test] fn period_90d()            { assert_eq!(parse_period("90d"), Some(90)); }
    #[test] fn period_1y()             { assert_eq!(parse_period("1y"), Some(365)); }
    #[test] fn period_invalid()        { assert_eq!(parse_period("xyz"), None); }
    #[test] fn period_empty()          { assert_eq!(parse_period(""), None); }
}
