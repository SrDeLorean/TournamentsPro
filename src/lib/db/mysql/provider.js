"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mysqlProvider = exports.MysqlDatabaseProvider = void 0;
const db_1 = require("@/lib/db");
const repositories_1 = require("@/lib/repositories");
class MysqlDatabaseProvider {
    executor;
    users = new repositories_1.UserRepository();
    organizations = new repositories_1.OrganizationRepository();
    teams = new repositories_1.TeamRepository();
    competitions = new repositories_1.CompetitionRepository();
    seasons = new repositories_1.SeasonRepository();
    constructor(executor) {
        this.executor = executor;
    }
    async query(sql, params = []) {
        if (this.executor) {
            return this.executor.queryRows(sql, params);
        }
        return (0, db_1.queryDB)(sql, params);
    }
    async execute(sql, params = []) {
        if (this.executor) {
            return this.executor.executeCommand(sql, params);
        }
        return (0, db_1.executeCommand)(sql, params);
    }
    async withTransaction(operation) {
        // Si ya estamos en una transacción, reusamos
        if (this.executor) {
            return operation(this);
        }
        return (0, db_1.withTransaction)(async (transactionExecutor) => {
            const txProvider = new MysqlDatabaseProvider(transactionExecutor);
            return operation(txProvider);
        });
    }
}
exports.MysqlDatabaseProvider = MysqlDatabaseProvider;
exports.mysqlProvider = new MysqlDatabaseProvider();
