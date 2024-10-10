;; title: aibtcdev-bank-account
;; version: 1.0.0
;; summary: A contract that allows specified principals to withdraw STX from the contract with given rules.

;; traits
;;

;; token definitions
;;

;; constants
;;
(define-constant DEPLOYER tx-sender)
(define-constant SELF (as-contract tx-sender))
(define-constant ERR_INVALID (err u1000))
(define-constant ERR_UNAUTHORIZED (err u1001))
(define-constant ERR_TOO_SOON (err u1002))


;; data vars
;;
(define-data-var withdrawalPeriod uint u144) ;; 144 Bitcoin blocks, ~1 day
(define-data-var withdrawalAmount uint u10000000) ;; 10,000,000 microSTX, or 10 STX
(define-data-var lastWithdrawalBlock uint u0)

;; data maps
;;
(define-map Users principal bool)

;; public functions
;;

(define-public (set-withdrawal-period (period uint))
  (begin
    (try! (is-deployer))
    (asserts! (> period u0) ERR_INVALID)
    (ok (var-set withdrawalPeriod period))
  )
)

(define-public (set-withdrawal-amount (amount uint))
  (begin
    (try! (is-deployer))
    (asserts! (> amount u0) ERR_INVALID)
    (ok (var-set withdrawalAmount amount))
  )
)

(define-public (override-last-withdrawal-block (block uint))
  (begin
    (try! (is-deployer))
    (asserts! (> block u0) ERR_INVALID)
    (ok (var-set lastWithdrawalBlock block))
  )
)

(define-public (set-user-list (userList (list 100 {user: principal, enabled: bool})))
  (begin
    (try! (is-deployer))
    (asserts! (> (len userList) u0) ERR_INVALID)
    (ok (map set-user-iter userList))
  )
)

(define-public (deposit-stx (amount uint))
  (begin
    (print {
      notification: "deposit-stx",
      payload: {
        amount: amount,
        caller: contract-caller,
        recipient: SELF
      }
    })
    (stx-transfer? amount contract-caller SELF)
  )
)

(define-public (withdraw-stx)
  (let
    (
      ;; verify user is known in the map (some not none)
      (requestor contract-caller)
      (userEnabled (unwrap! (map-get? Users contract-caller) ERR_UNAUTHORIZED))
    )
    ;; verify user is enabled in the map
    (asserts! userEnabled ERR_UNAUTHORIZED)
    ;; verify user is not withdrawing too soon
    (asserts! (>= block-height (+ (var-get lastWithdrawalBlock) (var-get withdrawalPeriod))) ERR_TOO_SOON)
    ;; update last withdrawal block
    (var-set lastWithdrawalBlock block-height)
    ;; print notification and transfer STX
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: (var-get withdrawalAmount),
        caller: contract-caller,
        recipient: contract-caller
      }
    })
    (as-contract (stx-transfer? (var-get withdrawalAmount) SELF requestor))
  )
)


;; read only functions
;;
(define-read-only (get-account-balance)
  (stx-get-balance SELF)
)

(define-read-only (get-standard-caller)
  (let ((d (unwrap-panic (principal-destruct? contract-caller))))
    (unwrap-panic (principal-construct? (get version d) (get hash-bytes d)))
  )
)

;; private functions
;;
(define-private (is-deployer)
  (ok (asserts! (is-eq DEPLOYER (get-standard-caller)) ERR_UNAUTHORIZED))
)

(define-private (set-user-iter (item {user: principal, enabled: bool}))
  (begin
    (print {
      notification: "set-user",
      payload: {
        caller: contract-caller,
        enabled: (get enabled item),
        user: (get user item),        
      }
    })
    (map-set Users (get user item) (get enabled item))
    (ok (get enabled item))
  )
)