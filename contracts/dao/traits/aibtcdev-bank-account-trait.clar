;; title: aibtcdev-bank-account-trait
;; version: 1.0.0
;; summary: A trait definition for bank account interfaces.

(define-trait bank-account-trait
 (
   ;; update configurable terms for the bank account
   ;; @param accountHolder optional new account holder principal
   ;; @param withdrawalPeriod optional new withdrawal period in blocks 
   ;; @param withdrawalAmount optional new withdrawal amount in microSTX
   ;; @param lastWithdrawalBlock optional override for last withdrawal block
   ;; @returns (response bool uint)
   (update-terms 
     (optional principal) 
     (optional uint)
     (optional uint) 
     (optional uint)
     (optional (buff 16))
     (response bool uint)
   )

   ;; deposit STX to the bank account
   ;; @param amount amount of microSTX to deposit
   ;; @returns (response bool uint)
   (deposit-stx (uint) (response bool uint))

   ;; withdraw STX from the bank account
   ;; @returns (response bool uint) 
   (withdraw-stx () (response bool uint))

   ;; get current account balance in microSTX
   ;; @returns uint
   (get-account-balance () uint)

   ;; get all current bank account terms
   ;; @returns {accountHolder: principal, lastWithdrawalBlock: uint, withdrawalAmount: uint, withdrawalPeriod: uint}
   (get-terms () 
     {
       accountHolder: principal,
       lastWithdrawalBlock: uint,
       withdrawalAmount: uint, 
       withdrawalPeriod: uint
     }
   )
 )
)