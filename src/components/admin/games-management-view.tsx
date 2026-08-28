'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gamepad2, Plus, Save, Server, Shield, Loader2, Trash2, Activity } from 'lucide-react';
import {
  ManagementGrid,
  ManagementHero,
  ManagementMetrics,
  ManagementPage,
  ManagementSection,
  MetricCard,
} from '@/components/dashboard/management-ui';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';

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
  stats_schema: unknown;
}

export function GamesManagementView() {
  const [games, setGames] = useState<GameDbRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingGame, setDeletingGame] = useState<GameDbRecord | null>(null);
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();
  
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
    // The effect intentionally synchronizes the client catalog with the admin API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleDeleteGame = async (game: GameDbRecord) => {
    startOperation(`Eliminación de disciplina: ${game.name}`);
    try {
      const res = await fetch(`/api/admin/games?slug=${encodeURIComponent(game.slug)}`, { method: 'DELETE' });
      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar la disciplina.');
      await fetchGames();
      endSuccess(`La disciplina "${game.name}" fue eliminada correctamente.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de red al intentar eliminar la disciplina.';
      endError(message);
      throw new Error(message);
    }
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
    <ManagementPage>
      <ManagementHero
        eyebrow="Gestión global · Catálogo competitivo"
        title="Gestión de disciplinas"
        description="Añade nuevos juegos y configura sus estadísticas para reportes."
        icon={Gamepad2}
        tone="cyan"
        badge={`${games.length} registradas`}
        actions={!isAdding ? (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 size-4" /> Añadir disciplina
          </Button>
        ) : undefined}
      />

      <ManagementMetrics>
        <MetricCard label="Disciplinas" value={games.length} hint="Catálogo disponible" icon={Gamepad2} tone="cyan" />
        <MetricCard label="Categorías" value={new Set(games.map((game) => game.category).filter(Boolean)).size} hint="Familias competitivas" icon={Shield} tone="violet" />
        <MetricCard label="Campos estadísticos" value={games.reduce((total, game) => total + (Array.isArray(game.stats_schema) ? game.stats_schema.length : 0), 0)} hint="Datos configurados" icon={Activity} tone="emerald" />
        <MetricCard label="Servicio" value={isLoading ? 'Sincronizando' : 'Operativo'} hint="API de disciplinas" icon={Server} tone="gold" />
      </ManagementMetrics>

      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {isAdding && (
        <ManagementSection title="Nueva disciplina" description="Define la identidad del juego y el esquema que utilizarán sus reportes." icon={Plus} tone="cyan">
          <div className="space-y-4">
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
        </ManagementSection>
      )}

      <ManagementSection title="Base de datos de juegos" description="Selecciona una disciplina para editar su identidad y estadísticas." icon={Gamepad2} tone="violet">
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 className="mx-auto size-8 animate-spin text-[var(--accent-cyan)]"/></div>
        ) : (
          <ManagementGrid>
          {games.map(g => (
            <article key={g.slug} className="group relative rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-5 transition-colors hover:bg-[var(--bg-card-hover)]">
              <div className="mb-4 flex flex-wrap justify-end gap-2 sm:absolute sm:right-4 sm:top-4 sm:mb-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950"
                  onClick={() => {
                    setNewSlug(g.slug);
                    setNewName(g.name);
                    setNewCategory(g.category);
                    setNewBrandColor(g.brand_color);
                    setStatsSchema(Array.isArray(g.stats_schema) ? g.stats_schema : [{ key: 'kills', label: 'Kills', type: 'number' }]);
                    setIsAdding(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 border-red-500/30 text-red-300 hover:bg-red-950"
                  onClick={() => setDeletingGame(g)}
                  aria-label={`Eliminar ${g.name}`}
                >
                  Eliminar
                </Button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-10 rounded-full" style={{ backgroundColor: g.brand_color }}></div>
                <div>
                  <h3 className="font-bold text-lg pr-16">{g.name}</h3>
                  <p className="text-xs text-gray-400 uppercase">{g.category}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-gray-500">SLUG: {g.slug}</p>
                <div className="text-xs font-mono text-gray-500 mt-2 border-t border-gray-800 pt-2">
                  ESTADÍSTICAS:
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(g.stats_schema) ? (g.stats_schema as StatSchemaField[]).map((s) => (
                      <span key={s.key} className="px-2 py-0.5 bg-gray-800 rounded-md text-[10px] text-cyan-200">{s.label} ({s.key})</span>
                    )) : <span className="text-gray-600">No definidas</span>}
                  </div>
                </div>
              </div>
            </article>
          ))}
          </ManagementGrid>
        )}
      </ManagementSection>
      {deletingGame && (
        <ConfirmModal
          isOpen
          onClose={() => setDeletingGame(null)}
          onConfirm={() => handleDeleteGame(deletingGame)}
          title={`Eliminar disciplina: ${deletingGame.name}`}
          description="La disciplina y su esquema estadístico dejarán de estar disponibles para nuevas competencias."
          confirmText="Eliminar disciplina"
          variant="danger"
          confirmationText={deletingGame.slug}
          consequences={[
            'Se eliminará la configuración estadística asociada.',
            'No podrá seleccionarse en nuevas competencias.',
            'Las referencias históricas existentes podrían conservar el slug.',
          ]}
        />
      )}
    </ManagementPage>
  );
}
