(define-trait executor-trait (
    ;; Execute a governance proposal
    (execute (principal) (response bool uint))

    ;; Enable or disable an extension contract
    (set-extension (principal bool) (response bool uint))

    ;; Check if a given principal is an enabled extension
    (is-extension (principal) (response bool uint))
))
