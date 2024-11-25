(define-trait aibtcdev-resource-mgmt-v1
  (
    (set-payment-address (principal principal) (response bool uint))
    (add-resource ((string-utf8 50) (string-utf8 255) uint) (response uint uint))
    (toggle-resource (uint) (response bool uint))
    (toggle-resource-by-name ((string-utf8 50)) (response bool uint))
  )
)

(define-trait aibtcdev-invoice-v1
  (
    (pay-invoice (uint (optional (buff 34))) (response uint uint))
    (pay-invoice-by-resource-name ((string-utf8 50) (optional (buff 34))) (response uint uint))
  )
)
