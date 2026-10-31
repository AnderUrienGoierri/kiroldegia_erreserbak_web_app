-- =============================================================================
-- ORDIZIAKO KIROLDEGIKO ERRESERBAK - DATU-BASEAREN ESKEMA (2. FASEA & BONOAK)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS kiroldegia
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE kiroldegia;

-- Taulak ezabatu (lehendik badaude)
DROP TABLE IF EXISTS erreserba;
DROP TABLE IF EXISTS bonoak;
DROP TABLE IF EXISTS bazkidea;
DROP TABLE IF EXISTS pista;

-- 1. PISTA TAULA (Soft Delete eta Hard Delete kudeaketarako zutabeekin)
CREATE TABLE pista (
  id             INT          NOT NULL AUTO_INCREMENT,
  izena          VARCHAR(50)  NOT NULL,
  kirola         VARCHAR(30)  NOT NULL,
  ezabatua       BOOLEAN      NOT NULL DEFAULT FALSE,
  ezabaketa_data DATETIME     NULL     DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE = InnoDB;

-- 2. BAZKIDEA TAULA (Emaila bonoekin lotzeko eta Soft Delete kudeaketarako zutabeekin)
CREATE TABLE bazkidea (
  id             INT          NOT NULL AUTO_INCREMENT,
  izena          VARCHAR(50)  NOT NULL,
  abizena        VARCHAR(80)  NOT NULL,
  emaila         VARCHAR(100) NULL,
  ezabatua       BOOLEAN      NOT NULL DEFAULT FALSE,
  ezabaketa_data DATETIME     NULL     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bazkidea_emaila (emaila)
) ENGINE = InnoDB;

-- 3. BONOAK TAULA (Soft Delete kudeaketarako zutabeekin)
CREATE TABLE `bonoak` (
  `emaila`         VARCHAR(100) NOT NULL,
  `saioak`         INT          NOT NULL,
  `ezabatua`       BOOLEAN      NOT NULL DEFAULT FALSE,
  `ezabaketa_data` DATETIME     NULL     DEFAULT NULL,
  PRIMARY KEY (`emaila`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. ERRESERBA TAULA (2. Fasea: UNIQUE murrizketa eta Soft Delete zutabeak)
CREATE TABLE erreserba (
  id             INT          NOT NULL AUTO_INCREMENT,
  pista_id       INT          NOT NULL,
  bazkidea_id    INT          NOT NULL,
  data           DATE         NOT NULL,
  ordua          TIME         NOT NULL,
  sortua         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ezabatua       BOOLEAN      NOT NULL DEFAULT FALSE,
  ezabaketa_data DATETIME     NULL     DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_erreserba_pista    FOREIGN KEY (pista_id)    REFERENCES pista (id)    ON DELETE RESTRICT,
  CONSTRAINT fk_erreserba_bazkidea FOREIGN KEY (bazkidea_id) REFERENCES bazkidea (id) ON DELETE RESTRICT,
  CONSTRAINT uq_erreserba_pista_data_ordua UNIQUE (pista_id, data, ordua),
  INDEX ix_erreserba_bazkidea_data (bazkidea_id, data)
) ENGINE = InnoDB;

-- =============================================================================
-- HASIERAKO DATUAK TXERTATU
-- =============================================================================

INSERT INTO pista (izena, kirola, ezabatua) VALUES
  ('Tenisa 1',  'Tenisa', FALSE),
  ('Tenisa 2',  'Tenisa', FALSE),
  ('Padel 1',   'Padela', FALSE),
  ('Frontoia',  'Pilota', FALSE);

INSERT INTO bazkidea (izena, abizena, emaila) VALUES
  ('Ane',    'Etxeberria', 'ane@goierri.eus'),
  ('Jon',    'Agirre',     'jon@goierri.eus'),
  ('Maialen','Urkiola',    'maialen@goierri.eus'),
  ('Iker',   'Lasa',       'iker@goierri.eus'),
  ('Nerea',  'Garmendia',  'nerea@goierri.eus');

INSERT INTO bonoak (emaila, saioak) VALUES
  ('ane@goierri.eus', 10),
  ('jon@goierri.eus', 3),
  ('maialen@goierri.eus', 0),
  ('iker@goierri.eus', 5),
  ('nerea@goierri.eus', 1);

-- =============================================================================
-- KANPOKO KONEXIOAK BAIMENTZEKO ERABILTZAILEA
-- =============================================================================
CREATE USER IF NOT EXISTS 'ikaslea'@'%' IDENTIFIED BY 'ikaslea';
GRANT ALL PRIVILEGES ON kiroldegia.* TO 'ikaslea'@'%';
FLUSH PRIVILEGES;
