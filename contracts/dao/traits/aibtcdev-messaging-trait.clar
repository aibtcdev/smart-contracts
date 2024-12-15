;; title: aibtcdev-messaging-trait
;; version: 1.0.0
;; summary: A trait definition for messaging interface.

(define-trait messaging-trait
  (
    ;; send a message on-chain
    ;; @param msg the message to send (up to 1MB)
    ;; @param opcode optional operation code
    ;; @returns (response bool uint)
    (send (string-ascii 1048576) (optional (buff 16)) (response bool uint))
  )
)