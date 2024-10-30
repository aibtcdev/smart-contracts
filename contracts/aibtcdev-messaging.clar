
;; title: messaging
;; version:
;; summary:
;; description:

;; traits
;;

;; token definitions
;;

;; constants
;;
(define-constant INPUT_ERROR (err u400))

;; data vars
;;

;; data maps
;;

;; public functions

(define-public (send (message (string-ascii 1048576)))
  (begin
    (asserts! (> (len message) u0) INPUT_ERROR)
    (print {
      caller: contract-caller,
      height: block-height,
      sender: tx-sender
    })
    (print message)
    (ok true)
  )
)

;; read only functions
;;

;; private functions
;;

