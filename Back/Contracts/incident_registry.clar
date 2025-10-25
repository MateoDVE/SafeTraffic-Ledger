;; ----------------------------------------------------------------------
;; Contrato: IncidentRegistry
;; Descripción: Gestiona el registro inmutable y transparente de incidentes
;; viales (multas, accidentes) mediante el modelo Commit-Reveal en Stacks.
;; Autores: SafeTraffic Ledger
;; ----------------------------------------------------------------------

(define-map incidents-data
  uint
  {
      proposer: principal,
      evidence-hash: (buff 32),
      meta-hash: (buff 32),
      geo-hash: (buff 32),
      status: uint,
      commit-height: uint,
      reveral-cid: (string-ascii 64)
    }
)

(define-map whistle-data
  uint
  {
      whash: (buff 32),
  }
))

(define-constant PENDING u0)
(define-constant REVEALED u1)
(define-constant DISPUTED u2)
(define-constant RESOLVED u3)
(define-constant STALE u4)

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-STATE (err u101))
(define-constant ERR-DEADLINE-EXPIRED (err u102))
(define-constant ERR-INVALID-HASH (err u103))
(define-constant ERR-ID-NOT-FOUND (err u104))

(define-data-var reveal-deadline-min uint u30) 

(define-data-var incident-id-counter uint u1)
