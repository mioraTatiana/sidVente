# NiFi Configuration
1. Start NiFi (http://localhost:8080/nifi)
2. Drag processors:
   - GetFile → Directory: nifi/input/
   - PutDatabaseRecord → JDBC: postgres://postgres:miorapost12@localhost/ventestock?table=ventestocks → RecordReader: CSVReader (schema match cols)
   - PutFile → Directory: nifi/output/
3. Connections: GetFile(success) → PutDatabaseRecord → PutFile
4. Start flow.
Backend simule déjà, mais pour real: remove backend csv-parse/insert, let NiFi do DB.