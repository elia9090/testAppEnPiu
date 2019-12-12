-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versione server:              10.3.14-MariaDB - mariadb.org binary distribution
-- S.O. server:                  Win64
-- HeidiSQL Versione:            9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dump della struttura del database db_gestionale_app
CREATE DATABASE IF NOT EXISTS `db_gestionale_app` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `db_gestionale_app`;

-- Dump della struttura di tabella db_gestionale_app.dettaglio_recesso_luce
CREATE TABLE IF NOT EXISTS `dettaglio_recesso_luce` (
  `ID_DETTAGLIO_LUCE` int(255) NOT NULL AUTO_INCREMENT,
  `ID_RECESSO_LUCE` int(255) NOT NULL,
  `ID_ASSEGNATARIO` int(255) DEFAULT NULL,
  `DATA_INSERIMENTO` datetime NOT NULL,
  `ULTIMA_MODIFICA` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `REFERENTE_RECESSO` varchar(30) DEFAULT '',
  `STATO` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID_DETTAGLIO_LUCE`),
  KEY `ID_RECESSO_LUCE` (`ID_RECESSO_LUCE`),
  KEY `ID_ASSEGNATARIO` (`ID_ASSEGNATARIO`),
  CONSTRAINT `FK_ASSEGNATARIO` FOREIGN KEY (`ID_ASSEGNATARIO`) REFERENCES `utenti` (`ID_UTENTE`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_RECESSI_LUCE` FOREIGN KEY (`ID_RECESSO_LUCE`) REFERENCES `recessi_luce` (`ID_RECESSO`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dump dei dati della tabella db_gestionale_app.dettaglio_recesso_luce: ~0 rows (circa)
/*!40000 ALTER TABLE `dettaglio_recesso_luce` DISABLE KEYS */;
/*!40000 ALTER TABLE `dettaglio_recesso_luce` ENABLE KEYS */;

-- Dump della struttura di tabella db_gestionale_app.recessi_luce
CREATE TABLE IF NOT EXISTS `recessi_luce` (
  `ID_RECESSO` int(255) NOT NULL AUTO_INCREMENT,
  `POD` varchar(50) DEFAULT NULL,
  `CD_TP_UTENZA` varchar(50) DEFAULT NULL,
  `INSOLUTO` varchar(50) DEFAULT NULL,
  `RAGIONE_SOCIALE` varchar(100) DEFAULT NULL,
  `INDIRIZZO_SEDE_LEGALE` varchar(100) DEFAULT NULL,
  `LOCALITA_SEDE_LEGALE` varchar(100) DEFAULT NULL,
  `INDIRIZZO_FORN` varchar(100) DEFAULT NULL,
  `LOCALITA_FORN` varchar(100) DEFAULT NULL,
  `TELEFONO` varchar(20) DEFAULT NULL,
  `CELLULARE` varchar(20) DEFAULT NULL,
  `KWH_ANNUI` varchar(50) DEFAULT NULL,
  `DATA_ATTIVAZIONE` date DEFAULT NULL,
  `DATA_VALIDITA_RECESSO` date DEFAULT NULL,
  `NOTA_RECESSO` varchar(200) DEFAULT NULL,
  `AGENZIA` varchar(40) DEFAULT NULL,
  `GRUPPO` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID_RECESSO`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dump dei dati della tabella db_gestionale_app.recessi_luce: ~0 rows (circa)
/*!40000 ALTER TABLE `recessi_luce` DISABLE KEYS */;
/*!40000 ALTER TABLE `recessi_luce` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
