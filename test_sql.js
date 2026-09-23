import sql from 'mssql';

const connectionStringsToTest = [
    "Server=localhost\\SQLEXPRESS;Database=santiye_yonetim_db;Trusted_Connection=Yes;Driver={Sql Server};TrustServerCertificate=Yes;",
    "Server=ALEYNAA\\SQLEXPRESS;Database=santiye_yonetim_db;Trusted_Connection=Yes;Driver={Sql Server};TrustServerCertificate=Yes;",
    "Server=.\\SQLEXPRESS;Database=santiye_yonetim_db;Trusted_Connection=Yes;Driver={Sql Server};TrustServerCertificate=Yes;",
    "Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=santiye_yonetim_db;Trusted_Connection=yes;",
    "Driver={ODBC Driver 18 for SQL Server};Server=localhost\\SQLEXPRESS;Database=santiye_yonetim_db;Trusted_Connection=yes;TrustServerCertificate=yes;"
];

async function testConnectionStrings() {
    console.log('🔍 SQL Express yerel ODBC / Named Pipes bağlantıları test ediliyor...');

    for (const connStr of connectionStringsToTest) {
        try {
            console.log(`Deneniyor: ${connStr}`);
            const pool = await sql.connect(connStr);
            console.log(`\n🎉 BİNGO! CANLI BAĞLANTI BAŞARILI!`);

            const res = await pool.request().query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES');
            console.log('SQL Server Tablolarınız:');
            res.recordset.forEach(t => console.log(` - ${t.TABLE_NAME}`));

            await pool.close();
            return connStr;
        } catch (err) {
            console.log(`❌ Başarısız: ${err.message}`);
        }
    }
}

testConnectionStrings();