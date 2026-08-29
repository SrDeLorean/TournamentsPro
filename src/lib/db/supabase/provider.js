"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseProvider = exports.SupabaseDatabaseProvider = void 0;
const implementations_1 = require("./implementations");
class SupabaseDatabaseProvider {
    users = new implementations_1.SupabaseUserRepository();
    organizations = new implementations_1.SupabaseOrganizationRepository();
    teams = new implementations_1.SupabaseTeamRepository();
    competitions = new implementations_1.SupabaseCompetitionRepository();
    seasons = new implementations_1.SupabaseSeasonRepository();
    async query(sql, params = []) {
        throw new Error('Las consultas SQL directas (queryDB) no están soportadas en Supabase REST. Debes usar los repositorios de dbProvider.');
    }
    async execute(sql, params = []) {
        throw new Error('La ejecución SQL directa (executeCommand) no está soportada en Supabase REST. Debes usar los repositorios de dbProvider.');
    }
    async withTransaction(operation) {
        // Para Supabase REST, emulamos la transacción inyectando el mismo provider. 
        // Si se requiere atomicidad estricta para operaciones complejas, se debe usar RPC de Postgres.
        return operation(this);
    }
}
exports.SupabaseDatabaseProvider = SupabaseDatabaseProvider;
exports.supabaseProvider = new SupabaseDatabaseProvider();
