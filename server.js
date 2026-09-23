import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const dbName = process.env.DB_NAME || 'santiye_yonetim_db';

// Native Windows Driver ile Kesin Bağlantı Konfigürasyonu
const mssqlConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=ALEYNAA\\SQLEXPRESS;Database=${dbName};Trusted_Connection=yes;TrustServerCertificate=yes;`,
    driver: 'msnodesqlv8'
};

let useMSSQL = false;
let mssqlPool = null;

async function connectMSSQL() {
    try {
        console.log(`⏳ MS SQL Server'a (ALEYNAA\\SQLEXPRESS) bağlanılıyor...`);

        mssqlPool = await new sql.ConnectionPool(mssqlConfig).connect();

        console.log(`\n======================================================`);
        console.log(`✅ MS SQL Server (ALEYNAA\\SQLEXPRESS / ${dbName}) CANLI BAĞLANTISI BAŞARILI!`);
        console.log(`======================================================\n`);
        useMSSQL = true;

        // Otomatik Başlangıç Personeli Ekleme
        const countRes = await mssqlPool.request().query('SELECT COUNT(*) as count FROM personnel');
        if (countRes.recordset[0].count === 0) {
            await mssqlPool.request().query(`
                INSERT INTO personnel (full_name, role, certs, assigned_site, status, is_new) VALUES
                ('aleyna igaç', 'İnşaat Mühendisi', 'B SINIF', 'Kent Villaları Konut Projesi', 'Geldi', 1),
                ('Engin Soydan', 'Şantiye Şefi', 'A Sınıfı İSG, PMP', 'Kent Villaları', 'Geldi', 0),
                ('Melis Karadağ', 'İnşaat Mühendisi', 'Beton Kalite Kontrolü', 'Kent Villaları', 'Geldi', 0),
                ('Volkan Yıldırım', 'İSG Uzmanı', 'B Sınıfı İSG', 'Kent Villaları', 'Geldi', 0),
                ('Turgut Çelik', 'Kalıp Ustası', 'Mesleki Yeterlilik Belgesi', 'Metro Viyadük', 'Vardiyada', 0),
                ('Orhan Şahin', 'Demirci Ustası', 'Ağır Sanayi Yeterlilik', 'Kent Villaları', 'Geldi', 0)
            `);
        }
    } catch (err) {
        console.log(`\n❌ MS SQL SERVER BAĞLANTI HATASI: ${err.message}`);
        console.log(`ℹ️ Kesintisiz çalışma için SQLite Otomatik Modu aktif.\n`);
        initSQLite();
    }
}

// Fallback SQLite Kurulumu
const dbPath = path.join(__dirname, 'santiye_yonetim.db');
let sqliteDb = null;

function initSQLite() {
    sqliteDb = new sqlite3.Database(dbPath);
    sqliteDb.serialize(() => {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            employer TEXT NOT NULL,
            budget REAL DEFAULT 0,
            progress_percent INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Devam Ediyor',
            start_date TEXT
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS personnel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            certs TEXT,
            assigned_site TEXT,
            project_id TEXT,
            status TEXT DEFAULT 'Geldi',
            is_new INTEGER DEFAULT 0
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS site_quick_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,
            log_time TEXT,
            log_date TEXT,
            user_name TEXT NOT NULL,
            log_type TEXT NOT NULL,
            detail TEXT NOT NULL,
            is_new INTEGER DEFAULT 1
        )`);
    });
}

// REST ENDPOINTS

app.get('/api/status', (req, res) => {
    res.json({
        status: 'Active',
        database_engine: useMSSQL ? `Microsoft SQL Server (${dbName})` : 'SQLite (Otomatik Mod)',
        connected: true
    });
});

app.get('/api/projects', async (req, res) => {
    if (useMSSQL) {
        try {
            const result = await mssqlPool.request().query('SELECT * FROM projects ORDER BY created_at DESC');
            return res.json(result.recordset);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } else {
        sqliteDb.all('SELECT * FROM projects', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

app.post('/api/projects', async (req, res) => {
    const { id, name, employer, budget, progress_percent, status, start_date } = req.body;
    if (useMSSQL) {
        try {
            const request = mssqlPool.request();
            request.input('id', sql.VarChar, id);
            request.input('name', sql.VarChar, name);
            request.input('employer', sql.VarChar, employer);
            request.input('budget', sql.Decimal(15, 2), budget || 0);
            request.input('progress_percent', sql.Int, progress_percent || 0);
            request.input('status', sql.VarChar, status || 'Devam Ediyor');
            request.input('start_date', sql.Date, start_date || new Date());
            await request.query(`
                INSERT INTO projects (id, name, employer, budget, progress_percent, status, start_date)
                VALUES (@id, @name, @employer, @budget, @progress_percent, @status, @start_date)
            `);
            res.status(201).json({ success: true, message: 'Proje MSSQL veritabanına kaydedildi.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } else {
        const query = `INSERT INTO projects (id, name, employer, budget, progress_percent, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        sqliteDb.run(query, [id, name, employer, budget, progress_percent, status, start_date], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ success: true, message: 'Proje veritabanına eklendi.' });
        });
    }
});

app.get('/api/personnel', async (req, res) => {
    if (useMSSQL) {
        try {
            const result = await mssqlPool.request().query('SELECT * FROM personnel ORDER BY id DESC');
            return res.json(result.recordset);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } else {
        sqliteDb.all('SELECT * FROM personnel ORDER BY id DESC', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

app.post('/api/personnel', async (req, res) => {
    const { full_name, role, certs, assigned_site, status } = req.body;
    if (useMSSQL) {
        try {
            const request = mssqlPool.request();
            request.input('full_name', sql.VarChar, full_name);
            request.input('role', sql.VarChar, role);
            request.input('certs', sql.NVarChar, certs || '');
            request.input('assigned_site', sql.VarChar, assigned_site || 'Kent Villaları');
            request.input('status', sql.VarChar, status || 'Geldi');
            await request.query(`
                INSERT INTO personnel (full_name, role, certs, assigned_site, status, is_new)
                VALUES (@full_name, @role, @certs, @assigned_site, @status, 1)
            `);
            res.status(201).json({ success: true, message: 'Personel MSSQL veritabanına kaydedildi.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } else {
        sqliteDb.run(
            `INSERT INTO personnel (full_name, role, certs, assigned_site, status, is_new) VALUES (?, ?, ?, ?, ?, 1)`,
            [full_name, role, certs, assigned_site, status],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ success: true, message: 'Personel eklendi.' });
            }
        );
    }
});

const DEFAULT_PORT = process.env.PORT || 5000;

async function startServer(port) {
    await connectMSSQL();
    const server = app.listen(port, () => {
        console.log(`🚀 BuildControl Pro Server http://localhost:${port} üzerinde başarıyla yayında!`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} dolu. Port ${port + 1} üzerinde deneniyor...`);
            startServer(port + 1);
        } else {
            console.error('Server hatası:', err);
        }
    });
}

startServer(DEFAULT_PORT);