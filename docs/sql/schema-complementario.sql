-- =====================================================================
-- Esquema complementario del APF2 -> RF-03, RF-04 y RF-08
--
-- Hibernate (spring.jpa.hibernate.ddl-auto=update) crea las tablas nuevas
-- en el arranque. Este script existe para revisar el esquema resultante
-- con un DBA y para aplicar los indices de los reportes de RF-08 en un
-- MySQL ya desplegado, sin depender de la actualizacion automatica.
--
-- Ejecutar contra la base de datos del backend (enao):
--   mysql -h <host> -P 3306 -u enao -p enao < docs/sql/schema-complementario.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- RF-03: documentos adjuntos de la inscripcion
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_documents (
  id                    BIGINT       NOT NULL AUTO_INCREMENT,
  applicant_id          BIGINT       NOT NULL,
  document_type         VARCHAR(50)  NOT NULL,
  original_name         VARCHAR(255) NOT NULL,
  storage_key           VARCHAR(255) NOT NULL,
  declared_content_type VARCHAR(100) NOT NULL,
  detected_content_type VARCHAR(100) NOT NULL,
  size_bytes            BIGINT       NOT NULL,
  sha256                CHAR(64)     NOT NULL,
  status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  upload_comment        VARCHAR(500) NULL,
  review_comment        VARCHAR(500) NULL,
  reviewed_by           VARCHAR(100) NULL,
  uploaded_at           DATETIME     NOT NULL,
  reviewed_at           DATETIME     NULL,
  download_count        BIGINT       NOT NULL DEFAULT 0,
  last_download_at      DATETIME     NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_document_storage_key UNIQUE (storage_key),
  CONSTRAINT fk_documents_applicant FOREIGN KEY (applicant_id)
    REFERENCES applicants (id)
);

CREATE INDEX ix_documents_applicant
  ON applicant_documents (applicant_id);
CREATE INDEX ix_documents_type_status
  ON applicant_documents (document_type, status);

-- ---------------------------------------------------------------------
-- RF-04: comprobante de inscripcion
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comprobantes (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  applicant_id     BIGINT       NOT NULL,
  serial           CHAR(36)     NOT NULL,
  sha256           CHAR(64)     NOT NULL,
  storage_key      VARCHAR(255) NOT NULL,
  period           VARCHAR(50)  NOT NULL,
  campus           VARCHAR(100) NOT NULL,
  institution      VARCHAR(255) NOT NULL,
  enrollment_status VARCHAR(30) NOT NULL,
  generated_at     DATETIME     NOT NULL,
  generated_by     VARCHAR(100) NULL,
  state            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  annulled_at      DATETIME     NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_comprobante_serial UNIQUE (serial),
  CONSTRAINT fk_comprobantes_applicant FOREIGN KEY (applicant_id)
    REFERENCES applicants (id)
);

CREATE INDEX ix_comprobantes_applicant
  ON comprobantes (applicant_id);
CREATE INDEX ix_comprobantes_state
  ON comprobantes (state);

-- ---------------------------------------------------------------------
-- RF-08: indices de los reportes agregados
--
-- Justificacion: los reportes agrupan por periodo, sede, institucion y
-- estado. Estos indices compuestos reducen el escaneo; verifique el
-- efecto con EXPLAIN y registrelo en la evidencia del APF3.
-- ---------------------------------------------------------------------
CREATE INDEX idx_applicants_period_status
  ON applicants (period, status);
CREATE INDEX idx_applicants_campus_period
  ON applicants (campus, period);
CREATE INDEX idx_applicants_institution_period
  ON applicants (university, period);
CREATE INDEX idx_applicants_status
  ON applicants (status);
CREATE INDEX idx_results_status
  ON exam_results (status);
CREATE INDEX idx_results_published
  ON exam_results (published_at);
