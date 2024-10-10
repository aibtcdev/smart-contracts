
;; title: test-proxy
;; version:
;; summary:
;; description:

;; traits
;;

;; token definitions
;;

;; constants
;;

;; data vars
;;

;; data maps
;;

;; public functions
;;
(define-public (get-standard-caller)
  (begin
    (print {
      caller: contract-caller,
      sender: tx-sender,
    })
    (ok (contract-call? .aibtcdev-bank-account get-standard-caller))
  )
)

;; read only functions
;;

;; private functions
;;

