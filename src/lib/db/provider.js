"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = exports.executeCommand = exports.queryDB = exports.dbProvider = void 0;
const provider_1 = require("./mysql/provider");
const provider_2 = require("./supabase/provider");
// Obtenemos el proveedor configurado desde las variables de entorno.
// Por defecto usaremos mysql para no romper el sistema existente.
const providerType = process.env.DATABASE_PROVIDER || 'mysql';
let activeProvider;
if (providerType === 'supabase') {
    activeProvider = provider_2.supabaseProvider;
}
else {
    activeProvider = provider_1.mysqlProvider;
}
exports.dbProvider = activeProvider;
// Exportamos alias para hacer el refactoring más fácil y gradual
exports.queryDB = activeProvider.query.bind(activeProvider);
exports.executeCommand = activeProvider.execute.bind(activeProvider);
exports.withTransaction = activeProvider.withTransaction.bind(activeProvider);
