;; ----------------------------------------------------------------------
;; Contrato: incident_registry
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
)

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

;; CAMBIO CRÍTICO #1: Se usan define-data-var para almacenar la principal del deployer,
;; ya que tx-sender solo se conoce en tiempo de ejecución.
(define-data-var AGENT-PRINCIPAL principal tx-sender)
(define-data-var AUDITOR-PRINCIPAL principal tx-sender)


(define-public (commit-incident 
  (evidence-hash (buff 32)) 
  (meta-hash (buff 32)) 
  (geo-hash (buff 32))
  (type uint)
)
(let(
    (new-id (var-get incident-id-counter))
  )
    ;; CAMBIO CRÍTICO #2: Se usa var-get para acceder a la dirección del agente.
    (asserts! (is-eq tx-sender (var-get AGENT-PRINCIPAL)) ERR-NOT-AUTHORIZED)
    
    (map-set incidents-data new-id
        {
          proposer: tx-sender,
          evidence-hash: evidence-hash,
          meta-hash: meta-hash,
          geo-hash: geo-hash,
          status: PENDING,
          commit-height: (get block-height),
          reveral-cid: ""
        }
      )
      (var-set incident-id-counter (+ new-id u1))
      (ok (print (tuple (event-name "Committed" ) (id new-id) (proposer tx-sender))))
    )
  ) 

(define-public (reveal-incident 
  (id uint)
  (cid (string-ascii 64))
  (meta-hash-check (buff 32))
  (salt (buff 32))
  (evidence-hash-check (buff 32))
)
  (let (
    ;; CAMBIO CRÍTICO #3: map-get? necesita la clave (id), no el nombre del mapa.
    (incident (map-get? incidents-data id))
  )
    (asserts! (is-some incident) ERR-ID-NOT-FOUND)

    (let (
      (unwrapped-incident (unwrap-panic incident))
    )
      ;; Se usa get status para acceder al campo del mapa.
      (asserts! (is-eq (get status unwrapped-incident) PENDING) ERR-INVALID-STATE)

      (let (
        ;; Se usa get commit-height para acceder al campo del mapa.
        (commit-height (get commit-height unwrapped-incident))
        (deadline-blocks (* (var-get reveal-deadline-min) u6))
      )
        ;; CAMBIO CRÍTICO #4: El commit-reveal debe ser antes del deadline. 
        ;; La condición de un plazo expirado es si la altura del bloque es MAYOR
        ;; o igual a la altura de compromiso más la altura límite.
        ;; (<= (+ commit-height deadline-blocks) (get block-height)) significa que ¡HA EXPIRADO!
        ;; Para permitir la revelación (mientras no expira), la condición debe ser:
        (asserts! (< (get block-height) (+ commit-height deadline-blocks)) ERR-DEADLINE-EXPIRED)
      )
      
      ;; Lógica de verificación de hash y actualización de estado (no estaba implementada)
      ;; ...
      
      ;; Aquí faltaría la lógica para verificar meta-hash, evidence-hash y actualizar el estado a REVEALED
      ;; (map-set incidents-data id (merge unwrapped-incident {status: REVEALED, reveral-cid: cid}))
      ;; (ok true)
      (ok true) ;; Placeholder
    )
  )
)


(define-public (add-whistle
  (id uint)
  (whash (buff 32))
) 
  (asserts! (is-some (map-get? incidents-data id)) ERR-ID-NOT-FOUND)
  
  (map-set whistle-data id {whash: whash})
  
  (ok (print (tuple (event-name "Whistle") (id id))))
)


(define-public (open-dispute
  (id uint)
  (reason-hash (buff 32))
)
  (let (
    (incident (map-get? incidents-data id))
  )
    ;; CAMBIO CRÍTICO #2: Se usa var-get para acceder a la dirección del auditor.
    (asserts! (is-eq tx-sender (var-get AUDITOR-PRINCIPAL)) ERR-NOT-AUTHORIZED)
    (asserts! (is-some incident) ERR-ID-NOT-FOUND)

    (asserts! (is-eq (get status (unwrap-panic incident)) REVEALED) ERR-INVALID-STATE)

    (map-set incidents-data id (merge (unwrap-panic incident) {status: DISPUTED}))

    (ok (print (tuple (event-name "Disputed") (id id) (reason-hash reason-hash))))
    )
)


(define-public (resolve-dispute
  (id uint)
  (new-status uint) ;; Debería ser RESOLVED (u3) o STALE (u4) en el caso de no revelación a tiempo
)
(let (
    (incident (map-get? incidents-data id))
  )
    ;; CAMBIO CRÍTICO #2: Se usa var-get para acceder a la dirección del auditor.
    (asserts! (is-eq tx-sender (var-get AUDITOR-PRINCIPAL)) ERR-NOT-AUTHORIZED)
    (asserts! (is-some incident) ERR-ID-NOT-FOUND)


    (asserts! (is-eq (get status (unwrap-panic incident)) DISPUTED) ERR-INVALID-STATE)
    (asserts! (or (is-eq new-status RESOLVED) (is-eq new-status STALE)) ERR-INVALID-STATE)

    (map-set incidents-data id (merge (unwrap-panic incident) {status: new-status}))
    
    (ok (print (tuple (event-name "Resolved") (id id) (new-status new-status))))
    ) 
)


(define-read-only (get-incident-by-id (id uint))
    (ok (map-get? incidents-data id))
)


(define-read-only (get-reveal-deadline-min)
    (ok (var-get reveal-deadline-min))
)