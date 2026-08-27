'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gamepad2, Plus, Save, Server, Shield, Loader2, Trash2 } from 'lucide-react';

interface StatSchemaField {
  key: string;
  label: string;
  type: string;
}

interface GameDbRecord {
  slug: string;
  name: string;
  category: string;
  brand_color: string;
  stats_schema: any;
}

export function GamesManagementView() {
  const [games, setGames] = useState<GameDbRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Nuevo juego form
  const [isAdding, setIsAdding] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newBrandColor, setNewBrandColor] = useState('#00F0FF');
  const [statsSchema, setStatsSchema] = useState<StatSchemaField[]>([{ key: 'kills', label: 'Kills', type: 'number' }]);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/admin/games');
      const data = await res.json();
      if (data.games) setGames(data.games);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleAddStat = () => {
    setStatsSchema([...statsSchema, { key: '', label: '', type: 'number' }]);
  };

  const handleUpdateStat = (index: number, field: keyof StatSchemaField, value: string) => {
    const newSchema = [...statsSchema];
    newSchema[index] = { ...newSchema[index], [field]: value };
    setStatsSchema(newSchema);
  };

  const handleRemoveStat = (index: number) => {
    const newSchema = [...statsSchema];
    newSchema.splice(index, 1);
    setStatsSchema(newSchema);
  };

  const handleSave = async () => {
    if (!newSlug || !newName) return alert('Slug y Nombre son obligatorios');
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newSlug,
          name: newName,
          category: newCategory,
          brand_color: newBrandColor,
          stats_schema: statsSchema
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAdding(false);
        fetchGames();
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        badgeText="Administración"
        title="Gestión de Disciplinas"
        description="Añade nuevos juegos y configura sus estadísticas para reportes."
        brandColor="#00F0FF"
      />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-cyan-400"/> Base de Datos de Juegos</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-cyan-600 hover:bg-cyan-500">
            <Plus className="w-4 h-4 mr-2" /> Añadir Disciplina
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-4">
          <h3 className="font-bold text-cyan-300">Nueva Disciplina</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Slug (ej: rocketleague)</label>
              <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} className="input-theme" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nombre (ej: Rocket League)</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="input-theme" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoría (ej: Deportes)</label>
              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-theme" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Color de Marca (HEX)</label>
              <Input value={newBrandColor} onChange={e => setNewBrandColor(e.target.value)} className="input-theme" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h4 className="text-sm font-bold text-gray-300 mb-2">Esquema de Estadísticas (Reportes de Partido)</h4>
            {statsSchema.map((stat, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <Input placeholder="Key (ej: goals)" value={stat.key} onChange={e => handleUpdateStat(i, 'key', e.target.value)} className="input-theme flex-1" />
                <Input placeholder="Label (ej: Goles)" value={stat.label} onChange={e => handleUpdateStat(i, 'label', e.target.value)} className="input-theme flex-1" />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveStat(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4"/></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddStat} className="mt-2 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Añadir Estadística
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-500">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Disciplina
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-500"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map(g => (
            <div key={g.slug} className="glass-panel p-5 rounded-2xl border border-[var(--border-card)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-10 rounded-full" style={{ backgroundColor: g.brand_color }}></div>
                <div>
                  <h3 className="font-bold text-lg">{g.name}</h3>
                  <p className="text-xs text-gray-400 uppercase">{g.category}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-gray-500">SLUG: {g.slug}</p>
                <div className="text-xs font-mono text-gray-500 mt-2 border-t border-gray-800 pt-2">
                  ESTADÍSTICAS:
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(g.stats_schema) ? g.stats_schema.map((s: any) => (
                      <span key={s.key} className="px-2 py-0.5 bg-gray-800 rounded-md text-[10px] text-cyan-200">{s.label} ({s.key})</span>
                    )) : <span className="text-gray-600">No definidas</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
