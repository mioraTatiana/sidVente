# NiFi - SID Ventes/Stocks

Ce dossier contient un blueprint du flux NiFi pour ton projet SID.

## Objectif du flux

1. Lire les fichiers CSV de ventes et stocks.
2. Normaliser le format des donnees.
3. Charger la table de staging SQL.
4. Declencher la procedure SQL de chargement vers le Data Warehouse.
5. Archiver les fichiers traites.

## Fichiers

- `flow-template.json`: definition du pipeline, des processors, des connexions et des parametres.

## Mapping des composants

- `ListFile` + `FetchFile`: ingestion de fichiers.
- `ConvertRecord` + `UpdateRecord`: conversion CSV -> JSON + enrichissement.
- `PutDatabaseRecord`: alimentation de `stg_sales_stock`.
- `ExecuteSQLRecord`: appel procedure de merge vers `sid_dw.fact_sales_stock`.

## Notes

- Le fichier est un blueprint de configuration pour reproduire le flux dans NiFi.
- Si tu veux un export NiFi XML/JSON 100% importable, il faut le generer directement depuis ton instance NiFi apres construction du process group.