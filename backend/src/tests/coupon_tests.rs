fn apply_discount(total: f64, discount_type: &str, value: f64) -> f64 {
    match discount_type {
        "percentage" => (total - total * (value / 100.0)).max(0.0),
        "fixed"      => (total - value).max(0.0),
        _            => total,
    }
}
fn r2(n: f64) -> f64 { (n * 100.0).round() / 100.0 }

#[test] fn pct_basic()        { assert_eq!(r2(apply_discount(100.0, "percentage", 10.0)), 90.0); }
#[test] fn pct_50()           { assert_eq!(r2(apply_discount(200.0, "percentage", 50.0)), 100.0); }
#[test] fn pct_100_zero()     { assert_eq!(r2(apply_discount(50.0,  "percentage", 100.0)), 0.0); }
#[test] fn fixed_basic()      { assert_eq!(r2(apply_discount(80.0,  "fixed", 20.0)), 60.0); }
#[test] fn fixed_no_negative(){ assert_eq!(r2(apply_discount(10.0,  "fixed", 50.0)), 0.0); }
#[test] fn unknown_passthrough(){ assert_eq!(r2(apply_discount(100.0,"bogus", 10.0)), 100.0); }
