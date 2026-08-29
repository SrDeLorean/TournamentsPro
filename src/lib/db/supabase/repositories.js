"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseBaseRepository = void 0;
const client_1 = require("./client");
class SupabaseBaseRepository {
    async findById(id) {
        const { data, error } = await client_1.supabase
            .from(this.tableName)
            .select('*')
            .eq(this.primaryKey, id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found
            throw new Error(`Error en findById(${this.tableName}): ${error.message}`);
        }
        return data ? this.mapRow(data) : null;
    }
    async findAll(options = {}) {
        const { where = {}, orderBy = 'created_at', orderDirection = 'DESC', limit = 50, offset = 0 } = options;
        let query = client_1.supabase.from(this.tableName).select('*');
        for (const [key, value] of Object.entries(where)) {
            if (value === null) {
                query = query.is(key, null);
            }
            else if (Array.isArray(value)) {
                query = query.in(key, value);
            }
            else {
                query = query.eq(key, value);
            }
        }
        query = query.order(orderBy, { ascending: orderDirection === 'ASC' });
        if (limit) {
            query = query.range(offset, offset + limit - 1);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Error en findAll(${this.tableName}): ${error.message}`);
        return (data || []).map(row => this.mapRow(row));
    }
    async count(options = {}) {
        const { where = {} } = options;
        let query = client_1.supabase.from(this.tableName).select('*', { count: 'exact', head: true });
        for (const [key, value] of Object.entries(where)) {
            if (value === null) {
                query = query.is(key, null);
            }
            else if (Array.isArray(value)) {
                query = query.in(key, value);
            }
            else {
                query = query.eq(key, value);
            }
        }
        const { count, error } = await query;
        if (error)
            throw new Error(`Error en count(${this.tableName}): ${error.message}`);
        return count || 0;
    }
    async create(data) {
        const dbData = this.mapToDb(data);
        const { data: result, error } = await client_1.supabase
            .from(this.tableName)
            .insert([dbData])
            .select()
            .single();
        if (error)
            throw new Error(`Error en create(${this.tableName}): ${error.message}`);
        return this.mapRow(result);
    }
    async update(id, data) {
        const dbData = this.mapToDb(data);
        // Si no hay datos para actualizar
        if (Object.keys(dbData).length === 0) {
            return this.findById(id);
        }
        dbData.updated_at = new Date().toISOString();
        const { data: result, error } = await client_1.supabase
            .from(this.tableName)
            .update(dbData)
            .eq(this.primaryKey, id)
            .select()
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found to update
            throw new Error(`Error en update(${this.tableName}): ${error.message}`);
        }
        return this.mapRow(result);
    }
    async delete(id) {
        const { error } = await client_1.supabase
            .from(this.tableName)
            .delete()
            .eq(this.primaryKey, id);
        if (error)
            throw new Error(`Error en delete(${this.tableName}): ${error.message}`);
        return true; // Asumimos éxito si no hay error
    }
}
exports.SupabaseBaseRepository = SupabaseBaseRepository;
