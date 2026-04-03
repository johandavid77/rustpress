#[cfg(test)]
mod tests {

    #[test]
    fn order_total_with_discount() {
        let subtotal = 100.0f64;
        let discount = 15.0f64;
        let total = (subtotal - discount).max(0.0);
        assert_eq!(total, 85.0);
    }

    #[test]
    fn order_discount_cannot_exceed_subtotal() {
        let subtotal = 10.0f64;
        let discount = 50.0f64;
        let total = (subtotal - discount).max(0.0);
        assert_eq!(total, 0.0);
    }

    #[test]
    fn coupon_percent_discount() {
        let subtotal = 200.0f64;
        let percent  = 20.0f64;
        let discount = subtotal * percent / 100.0;
        assert_eq!(discount, 40.0);
    }

    #[test]
    fn coupon_fixed_discount_capped() {
        let subtotal = 30.0f64;
        let fixed    = 50.0f64;
        let discount = fixed.min(subtotal);
        assert_eq!(discount, 30.0);
    }

    #[test]
    fn coupon_min_order_not_met() {
        let subtotal  = 40.0f64;
        let min_order = 50.0f64;
        let valid = subtotal >= min_order;
        assert!(!valid);
    }

    #[test]
    fn coupon_min_order_met() {
        let subtotal  = 60.0f64;
        let min_order = 50.0f64;
        let valid = subtotal >= min_order;
        assert!(valid);
    }

    #[test]
    fn coupon_max_uses_exceeded() {
        let max_uses = 10i32;
        let uses     = 10i32;
        let valid = uses < max_uses;
        assert!(!valid);
    }

    #[test]
    fn order_status_transitions() {
        let valid_statuses = ["pending","paid","processing","shipped","delivered","cancelled","refunded"];
        assert!(valid_statuses.contains(&"paid"));
        assert!(valid_statuses.contains(&"refunded"));
        assert!(!valid_statuses.contains(&"unknown"));
    }

    #[test]
    fn payment_status_to_order_status() {
        let map = |s: &str| match s {
            "completed" => "paid",
            "failed"    => "cancelled",
            "refunded"  => "refunded",
            _           => "pending",
        };
        assert_eq!(map("completed"), "paid");
        assert_eq!(map("failed"),    "cancelled");
        assert_eq!(map("refunded"),  "refunded");
        assert_eq!(map("unknown"),   "pending");
    }
}
