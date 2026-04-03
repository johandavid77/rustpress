#[cfg(test)]
mod tests {

    fn slugify(s: &str) -> String {
        s.to_lowercase()
         .chars()
         .map(|c| if c.is_alphanumeric() { c } else { '-' })
         .collect::<String>()
         .split('-')
         .filter(|s| !s.is_empty())
         .collect::<Vec<_>>()
         .join("-")
    }

    #[test] fn slug_basic()        { assert_eq!(slugify("Hello World"),       "hello-world"); }
    #[test] fn slug_special_chars(){ assert_eq!(slugify("Café & Résumé"),     "café-résumé"); }
    #[test] fn slug_multiple_spaces(){ assert_eq!(slugify("hello   world"),   "hello-world"); }
    #[test] fn slug_numbers()      { assert_eq!(slugify("Post 123 Title"),    "post-123-title"); }
    #[test] fn slug_already_slug() { assert_eq!(slugify("already-a-slug"),    "already-a-slug"); }
    #[test] fn slug_empty()        { assert_eq!(slugify(""),                  ""); }
    #[test] fn slug_only_spaces()  { assert_eq!(slugify("   "),               ""); }
    #[test] fn slug_uppercase()    { assert_eq!(slugify("RUST CMS"),          "rust-cms"); }
}
