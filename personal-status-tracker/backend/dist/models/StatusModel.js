"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusModel = void 0;
const database_1 = require("./database");
class StatusModel {
    constructor() {
        this.db = database_1.database.getDatabase();
    }
    async getLatestStatus(userId = 'default_user') {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT id, user_id as userId, last_water_intake as lastWaterIntake, 
               altitude, last_updated as lastUpdated, created_at as createdAt
        FROM status_entries 
        WHERE user_id = ?
        ORDER BY created_at DESC 
        LIMIT 1
      `;
            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row || null);
                }
            });
        });
    }
    async createStatus(data, userId = 'default_user') {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const query = `
        INSERT INTO status_entries (user_id, last_water_intake, altitude, last_updated)
        VALUES (?, ?, ?, ?)
      `;
            this.db.run(query, [userId, data.lastWaterIntake, data.altitude, now], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    // Return the created status
                    const newStatus = {
                        id: this.lastID,
                        userId,
                        lastWaterIntake: data.lastWaterIntake,
                        altitude: data.altitude,
                        lastUpdated: now,
                        createdAt: now
                    };
                    resolve(newStatus);
                }
            });
        });
    }
    async updateStatus(data, userId = 'default_user') {
        return new Promise(async (resolve, reject) => {
            try {
                // Get current status first
                const currentStatus = await this.getLatestStatus(userId);
                if (!currentStatus) {
                    reject(new Error('No existing status found'));
                    return;
                }
                const now = new Date().toISOString();
                const updatedData = {
                    lastWaterIntake: data.lastWaterIntake ?? currentStatus.lastWaterIntake,
                    altitude: data.altitude ?? currentStatus.altitude,
                    lastUpdated: now
                };
                // Create a new entry instead of updating (for audit trail)
                const newStatus = await this.createStatus(updatedData, userId);
                resolve(newStatus);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async getStatusHistory(userId = 'default_user', limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT id, user_id as userId, last_water_intake as lastWaterIntake, 
               altitude, last_updated as lastUpdated, created_at as createdAt
        FROM status_entries 
        WHERE user_id = ?
        ORDER BY created_at DESC 
        LIMIT ?
      `;
            this.db.all(query, [userId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows || []);
                }
            });
        });
    }
    async deleteAllStatus(userId = 'default_user') {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM status_entries WHERE user_id = ?';
            this.db.run(query, [userId], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.changes > 0);
                }
            });
        });
    }
}
exports.StatusModel = StatusModel;
//# sourceMappingURL=StatusModel.js.map