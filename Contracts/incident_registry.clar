;; ----------------------------------------------------------------------
;; Contrato: incident_registry
;; Descripción: Registro inmutable de incidentes viales con Commit–Reveal
;; Autores: SafeTraffic Ledger
;; ----------------------------------------------------------------------

;; ---------------------------
;; Storage
;; ---------------------------

(define-map incidents-data
  uint
  {
    proposer: principal,
    evidence-hash: (buff 32),
    meta-hash: (buff 32),
    geo-hash: (buff 32),
    status: uint,
    commit-height: uint,
    reveal-cid: (string-ascii 64),
    incident-type: uint
  }
)

(define-map whistle-data
  uint
  {
    whash: (buff 32)
  }
)

(define-constant PENDING  u0)
(define-constant REVEALED u1)
(define-constant DISPUTED u2)
(define-constant RESOLVED u3)
(define-constant STALE    u4)

(define-constant ERR-NOT-AUTHORIZED  (err u100))
(define-constant ERR-INVALID-STATE   (err u101))
(define-constant ERR-DEADLINE-EXPIRED (err u102))
(define-constant ERR-INVALID-HASH    (err u103))
(define-constant ERR-ID-NOT-FOUND    (err u104))
(define-constant ERR-ALREADY-SET     (err u105))

;; Guardamos el deadline directamente en BLOQUES (no minutos)
(define-data-var reveal-deadline-blocks uint u30)

(define-data-var incident-id-counter uint u0)

;; Owner del contrato (primer caller que llame a init-owner)
(define-data-var CONTRACT-OWNER (optional principal) none)

;; Agente y Auditor configurables una sola vez por el owner
(define-data-var AGENT-PRINCIPAL   (optional principal) none)
(define-data-var AUDITOR-PRINCIPAL (optional principal) none)

;; ---------------------------
;; Utils
;; ---------------------------

(define-read-only (is-owner (p principal))
  (ok (is-eq (some p) (var-get CONTRACT-OWNER)))
)

(define-read-only (unwrap-some! (opt (optional principal)))
  (match opt p (ok p) (err false))
)

(define-private (assert-owner)
  (begin
    (asserts! (is-eq (ok true) (is-owner tx-sender)) ERR-NOT-AUTHORIZED)
    (ok true))
)

(define-private (assert-principal-is (who (optional principal)))
  (let ((p (var-get who)))
    (asserts! (is-some p) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq tx-sender (unwrap! p ERR-NOT-AUTHORIZED)) ERR-NOT-AUTHORIZED)
    (ok true))
)

;; ---------------------------
;; Inicialización (one-shot)
;; ---------------------------

(define-public (init-owner)
  (begin
    (asserts! (is-none (var-get CONTRACT-OWNER)) ERR-ALREADY-SET)
    (var-set CONTRACT-OWNER (some tx-sender))
    (ok true))
)

(define-public (set-agent (p principal))
  (begin
    (unwrap! (assert-owner) false)
    (asserts! (is-none (var-get AGENT-PRINCIPAL)) ERR-ALREADY-SET)
    (var-set AGENT-PRINCIPAL (some p))
    (ok true))
)

(define-public (set-auditor (p principal))
  (begin
    (unwrap! (assert-owner) false)
    (asserts! (is-none (var-get AUDITOR-PRINCIPAL)) ERR-ALREADY-SET)
    (var-set AUDITOR-PRINCIPAL (some p))
    (ok true))
)

(define-public (set-reveal-deadline-blocks (blocks uint))
  (begin
    (unwrap! (assert-owner) false)
    (var-set reveal-deadline-blocks blocks)
    (ok true))
)

;; ---------------------------
;; Commit
;; ---------------------------

(define-public (commit-incident
  (evidence-hash (buff 32))
  (meta-hash     (buff 32))
  (geo-hash      (buff 32))
  (incident-type uint)
)
  (let (
    (aid (var-get AGENT-PRINCIPAL))
    (new-id (var-get incident-id-counter))
  )
    (asserts! (is-some aid) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq tx-sender (unwrap! aid ERR-NOT-AUTHORIZED)) ERR-NOT-AUTHORIZED)

    (map-set incidents-data new-id
      {
        proposer: tx-sender,
        evidence-hash: evidence-hash,
        meta-hash: meta-hash,
        geo-hash: geo-hash,
        status: PENDING,
        commit-height: (block-height),
        reveal-cid: "",
        incident-type: incident-type
      }
    )
    (var-set incident-id-counter (+ new-id u1))
    (ok (print (tuple (event "Committed") (id new-id) (proposer tx-sender))))
  )
)

;; ---------------------------
;; Reveal
;; ---------------------------

(define-public (reveal-incident
  (id uint)
  (cid (string-ascii 64))
  (meta-preimage (buff 32))
  (evidence-preimage (buff 32))
  (salt (buff 32))
)
  (let (
    (opt (map-get? incidents-data id))
  )
    (asserts! (is-some opt) ERR-ID-NOT-FOUND)
    (let ((row (unwrap-panic opt)))
      (asserts! (is-eq (get status row) PENDING) ERR-INVALID-STATE)

      (let (
        (commit-h (get commit-height row))
        (deadline (+ commit-h (var-get reveal-deadline-blocks)))
      )
        ;; permitimos reveal si AÚN no venció
        (asserts! (< (block-height) deadline) ERR-DEADLINE-EXPIRED)
      )

      ;; Verificación de hashes: sha256(preimage ++ salt) == hash guardado
      (let (
        (meta-ok (is-eq (sha256 (concat meta-preimage salt)) (get meta-hash row)))
        (ev-ok   (is-eq (sha256 (concat evidence-preimage salt)) (get evidence-hash row)))
      )
        (asserts! (and meta-ok ev-ok) ERR-INVALID-HASH)
      )

      (map-set incidents-data id (merge row {status: REVEALED, reveal-cid: cid}))
      (ok (print (tuple (event "Revealed") (id id))))
    )
  )
)

;; ---------------------------
;; Whistle
;; ---------------------------

(define-public (add-whistle
  (id uint)
  (whash (buff 32))
)
  (begin
    (asserts! (is-some (map-get? incidents-data id)) ERR-ID-NOT-FOUND)
    (map-set whistle-data id {whash: whash})
    (ok (print (tuple (event "Whistle") (id id)))))
)

;; ---------------------------
;; Dispute / Resolve
;; ---------------------------

(define-public (open-dispute
  (id uint)
  (reason-hash (buff 32))
)
  (let ((opt (map-get? incidents-data id)))
    (unwrap! (assert-principal-is AUDITOR-PRINCIPAL) false)
    (asserts! (is-some opt) ERR-ID-NOT-FOUND)
    (let ((row (unwrap-panic opt)))
      (asserts! (is-eq (get status row) REVEALED) ERR-INVALID-STATE)
      (map-set incidents-data id (merge row {status: DISPUTED}))
      (ok (print (tuple (event "Disputed") (id id) (reason-hash reason-hash))))
    )
  )
)

(define-public (resolve-dispute
  (id uint)
  (new-status uint) ;; debe ser RESOLVED u3 o STALE u4
)
  (let ((opt (map-get? incidents-data id)))
    (unwrap! (assert-principal-is AUDITOR-PRINCIPAL) false)
    (asserts! (is-some opt) ERR-ID-NOT-FOUND)
    (let ((row (unwrap-panic opt)))
      (asserts! (is-eq (get status row) DISPUTED) ERR-INVALID-STATE)
      (asserts! (or (is-eq new-status RESOLVED) (is-eq new-status STALE)) ERR-INVALID-STATE)
      (map-set incidents-data id (merge row {status: new-status}))
      (ok (print (tuple (event "Resolved") (id id) (new-status new-status))))
    )
  )
)

;; ---------------------------
;; Read-only
;; ---------------------------

(define-read-only (get-incident-by-id (id uint))
  (ok (map-get? incidents-data id))
)

(define-read-only (get-reveal-deadline-blocks)
  (ok (var-get reveal-deadline-blocks))
)
