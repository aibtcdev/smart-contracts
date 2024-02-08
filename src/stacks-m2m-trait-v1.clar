(define-trait stacks-m2m-trait-v1
  (
    (set-payment-address (principal principal) (response bool uint)) ;; works
    (add-resource ((string-utf8 50) (string-utf8 255) uint) (response bool uint)) ;; error
    (delete-resource (uint) (response bool uint)) ;; works
    (delete-resource-by-name ((string-utf8 50)) (response bool uint)) ;; works
    (pay-invoice (uint (optional (buff 34))) (response bool uint))
    (pay-invoice-by-resource-name ((string-utf8 50) (optional (buff 34))) (response bool uint))
  )
)
