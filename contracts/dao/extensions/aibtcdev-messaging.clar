;; title: aibtcdev-messaging
;; version: 1.0.0
;; summary: An extension to send messages on-chain to anyone listening to this contract.

;; traits
;;
(impl-trait .aibtcdev-messaging-trait.messaging-trait)
(impl-trait .aibtcdev-extension-trait.extension-trait)

;; constants
;;
(define-constant INPUT_ERROR (err u400))
(define-constant ERR_UNAUTHORIZED (err u2000))

;; public functions

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (send (msg (string-ascii 1048576)) (opcode (optional (buff 16))))
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
