
;; title: aibtcdev-messaging
;; version: 1.0
;; summary: A simple messaging contract agents can use.
;; description: Send an on-chain message to anyone listening to this contract.

;; traits
;;
(impl-trait .aibtcdev-extension-trait.extension-trait)

;; constants
;;
(define-constant INPUT_ERROR (err u400))
(define-constant ERR_UNAUTHORIZED (err u2000))

;; public functions

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-dao)
    (contract-call? .aibtcdev-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (send (msg (string-ascii 1048576)))
  (begin
    (asserts! (> (len msg) u0) INPUT_ERROR)
    ;; print the message as the first event
    (print msg)
    ;; print the envelope info for the message
    (print {
      notification: "send",
      payload: {
        caller: contract-caller,
        height: block-height,
        sender: tx-sender,
      }
    })
    (ok true)
  )
)
