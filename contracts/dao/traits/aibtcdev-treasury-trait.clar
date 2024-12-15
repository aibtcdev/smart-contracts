;; title: aibtcdev-treasury-trait
;; version: 1.0.0
;; summary: A trait definition for treasury deposit and withdrawal operations.

(define-trait treasury-trait
 (
   ;; STX deposits and withdrawals
   (deposit-stx (uint) (response bool uint))
   (withdraw-stx (uint principal) (response bool uint))

   ;; Fungible token deposits and withdrawals
   (deposit-ft (<ft-trait> uint) (response bool uint))
   (withdraw-ft (<ft-trait> uint principal) (response bool uint))

   ;; NFT deposits and withdrawals 
   (deposit-nft (<nft-trait> uint) (response bool uint))
   (withdraw-nft (<nft-trait> uint principal) (response bool uint))
 )
)