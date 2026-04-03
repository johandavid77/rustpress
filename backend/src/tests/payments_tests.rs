use hmac::{Hmac, Mac};
use sha2::Sha256;

fn make_sig(payload: &[u8], secret: &str, ts: &str) -> String {
    let signed = format!("{}.{}", ts, std::str::from_utf8(payload).unwrap());
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(signed.as_bytes());
    format!("t={},v1={}", ts, hex::encode(mac.finalize().into_bytes()))
}

fn verify(payload: &[u8], sig: &str, secret: &str) -> bool {
    let ts  = sig.split(',').find(|p| p.starts_with("t=")).and_then(|p| p.strip_prefix("t=")).unwrap_or("");
    let v1  = sig.split(',').find(|p| p.starts_with("v1=")).and_then(|p| p.strip_prefix("v1=")).unwrap_or("");
    let signed = format!("{}.{}", ts, std::str::from_utf8(payload).unwrap());
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(signed.as_bytes());
    hex::encode(mac.finalize().into_bytes()) == v1
}

#[test] fn valid_sig()    { let p = b"{}"; assert!(verify(p, &make_sig(p, "sec", "123"), "sec")); }
#[test] fn wrong_secret() { let p = b"{}"; assert!(!verify(p, &make_sig(p, "right", "1"), "wrong")); }
#[test] fn tampered()     { 
    let p = b"{}"; let sig = make_sig(p, "sec", "1");
    assert!(!verify(b"{\"injected\":true}", &sig, "sec")); 
}

#[test] fn avg_rating_math() {
    let r = vec![4, 5, 3, 4, 5];
    let avg = r.iter().sum::<i32>() as f64 / r.len() as f64;
    assert_eq!((avg * 10.0).round() / 10.0, 4.2);
}

#[test] fn avg_empty_zero() {
    let r: Vec<i32> = vec![];
    let avg = if r.is_empty() { 0.0 } else { r.iter().sum::<i32>() as f64 / r.len() as f64 };
    assert_eq!(avg, 0.0);
}

#[test] fn rating_distribution() {
    let r = vec![5, 5, 4, 3, 5, 1, 4];
    assert_eq!(r.iter().filter(|&&x| x == 5).count(), 3);
    assert_eq!(r.iter().filter(|&&x| x == 4).count(), 2);
    assert_eq!(r.iter().filter(|&&x| x == 1).count(), 1);
}
