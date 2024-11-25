;; title: aibtcdev-treasury
;; version: 1.0.0
;; summary: An extension to manage STX, SIP-009 NFTs, and SIP-010 FTs for the DAO.

;; traits
;;

(impl-trait .aibtcdev-extension-trait.extension-trait)
;; MAINNET: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait
(use-trait ft-trait 'ST1NXBK3K5YYMD6FD41MVNP3JS1GABZ8TRVX023PT.sip-010-trait-ft-standard.sip-010-trait)
;; MAINNET: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait
(use-trait nft-trait 'ST1NXBK3K5YYMD6FD41MVNP3JS1GABZ8TRVX023PT.nft-trait.nft-trait)

;; constants
;;

(define-constant ERR_UNAUTHORIZED (err u2000))
(define-constant ERR_UNKNOWN_ASSSET (err u2001))
(define-constant TREASURY (as-contract tx-sender))

;; data vars
;;
(define-data-var poxContract principal 'SP000000000000000000002Q6VF78.pox-4)


;; data maps
;;

(define-map AllowedAssets principal bool)

;; public functions
;;

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .aibtcdev-dao)
    (contract-call? .aibtcdev-dao is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

;; add or update an asset to the allowed list
(define-public (allow-asset (token principal) (enabled bool))
  (begin
    (try! (is-dao-or-extension))
    (print {
      event: "allow-asset",
      enabled: enabled,
      token: token
    })
    (ok (map-set AllowedAssets token enabled))
  )
)

;; add or update a list of assets to the allowed list
(define-public (allow-assets (allowList (list 100 {token: principal, enabled: bool})))
  (begin
    (try! (is-dao-or-extension))
    (ok (map allow-assets-iter allowList))
  )
)

;; deposit STX to the treasury
(define-public (deposit-stx (amount uint))
  (begin
    (print {
      event: "deposit-stx",
      amount: amount,
      caller: contract-caller,
      recipient: TREASURY,
      sender: tx-sender
    })
    (stx-transfer? amount tx-sender TREASURY)
  )
)

;; deposit FT to the treasury
(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    (asserts! (is-allowed (contract-of ft)) ERR_UNKNOWN_ASSSET)
    (print {
      event: "deposit-ft",
      amount: amount,
      assetContract: (contract-of ft),
      caller: contract-caller,
      recipient: TREASURY,
      sender: tx-sender
    })
    (contract-call? ft transfer amount tx-sender TREASURY none)
  )
)

;; deposit NFT to the treasury
(define-public (deposit-nft (nft <nft-trait>) (id uint))
  (begin
    (asserts! (is-allowed (contract-of nft)) ERR_UNKNOWN_ASSSET)
    (print {
      event: "deposit-nft",
      assetContract: (contract-of nft),
      caller: contract-caller,
      recipient: TREASURY,
      sender: tx-sender,
      tokenId: id,
    })
    (contract-call? nft transfer id tx-sender TREASURY)
  )
)

;; withdraw STX from the treasury
(define-public (withdraw-stx (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (print {
      event: "withdraw-stx",
      amount: amount,
      caller: contract-caller,
      recipient: recipient,
      sender: tx-sender
    })
    (as-contract (stx-transfer? amount TREASURY recipient))
  )
)

;; withdraw FT from the treasury
(define-public (withdraw-ft (ft <ft-trait>) (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-allowed (contract-of ft)) ERR_UNKNOWN_ASSSET)
    (print {
      event: "withdraw-ft",
      assetContract: (contract-of ft),
      caller: contract-caller,
      recipient: recipient,
      sender: tx-sender
    })
    (as-contract (contract-call? ft transfer amount TREASURY recipient none))
  )
)

;; withdraw NFT from the treasury
(define-public (withdraw-nft (nft <nft-trait>) (id uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-allowed (contract-of nft)) ERR_UNKNOWN_ASSSET)
    (print {
      event: "withdraw-nft",
      assetContract: (contract-of nft),
      caller: contract-caller,
      recipient: recipient,
      sender: tx-sender,
      tokenId: id
    })
    (as-contract (contract-call? nft transfer id TREASURY recipient))
  )
)

;; delegate STX for stacking
(define-public (delegate-stx (maxAmount uint) (to principal))
  (begin
    (try! (is-dao-or-extension))
    (print {
      event: "delegate-stx",
      amount: maxAmount,
      caller: contract-caller,
      delegate: to,
      sender: tx-sender
    })
    (match (as-contract (contract-call? (var-get poxContract) delegate-stx maxAmount to none none))
      success (ok success)
      err (err (to-uint err))
    )
  )
)

;; revoke STX delegation, STX unlocks after cycle ends
(define-public (revoke-delegate-stx)
  (begin
    (try! (is-dao-or-extension))
    (print {
      event: "revoke-delegate-stx",
      caller: contract-caller,
      sender: tx-sender
    })
    (match (as-contract (contract-call? (var-get poxContract) revoke-delegate-stx))
      success (begin (print success) (ok true))
      err (err (to-uint err))
    )
  )
)

;; read only functions
;;

(define-read-only (is-allowed-asset (assetContract principal))
  (default-to false (get-allowed-asset assetContract))
)

(define-read-only (get-allowed-asset (assetContract principal))
  (map-get? AllowedAssets assetContract)
)

;; private functions
;;

;; set-assets helper function
(define-private (allow-assets-iter (item {token: principal, enabled: bool}))
  (begin
    (print {
      event: "allow-asset",
      enabled: (get enabled item),
      token: (get token item)
    })
    (map-set AllowedAssets (get token item) (get enabled item))
  )
)

