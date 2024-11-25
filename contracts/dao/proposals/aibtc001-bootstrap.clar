(impl-trait .aibtcdev-proposal-trait.proposal-trait)

(define-public (execute (sender principal))
  (begin  
    ;; set initial extensions
    (try! (contract-call? .aibtcdev-dao set-extensions
      (list
        {extension: .aibtcdev-bank-account, enabled: true}
        {extension: .aibtcdev-messaging, enabled: true}
        {extension: .aibtcdev-payments, enabled: true}
        {extension: .aibtcdev-treasury, enabled: true}
      )
    ))
    ;; print manifest
    (print "manifest")
    (ok true)
  )
)