import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  apiService,
  type Campaign,
  type CharacterClass,
  type CharacterSheet,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeskContext {
  selectedCampaignId: number | null;
}

export function CharactersPage() {
  const { selectedCampaignId } = useOutletContext<DeskContext>();
  const [characters, setCharacters] = useState<CharacterSheet[]>([]);
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    name: "",
    character_class: 0,
    level: 1,
    race: "",
    background: "",
    skills: "",
    equipment: "",
    spells: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const [chars, classList] = await Promise.all([
        apiService.listCharacters(),
        apiService.listClasses(),
      ]);
      setCharacters(chars);
      setClasses(classList);
      if (selectedCampaignId) {
        const campaignData = await apiService.getCampaign(selectedCampaignId);
        setCampaign(campaignData);
      } else {
        setCampaign(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить персонажей");
    }
  };

  useEffect(() => {
    load();
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!draft.character_class && classes.length > 0) {
      setDraft((prev) => ({ ...prev, character_class: classes[0].id }));
    }
  }, [classes, draft.character_class]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = {
        ...draft,
        level: Number(draft.level) || 1,
      };
      if (editingId) {
        await apiService.updateCharacter(editingId, payload);
      } else {
        await apiService.createCharacter(payload);
      }
      setEditingId(null);
      setDraft({
        name: "",
        character_class: classes[0]?.id ?? 0,
        level: 1,
        race: "",
        background: "",
        skills: "",
        equipment: "",
        spells: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения персонажа");
    }
  };

  const handleEdit = (character: CharacterSheet) => {
    setEditingId(character.id);
    setDraft({
      name: character.name,
      character_class: character.character_class,
      level: character.level,
      race: character.race,
      background: character.background,
      skills: character.skills,
      equipment: character.equipment,
      spells: character.spells,
    });
  };

  const handleDelete = async (characterId: number) => {
    setError(null);
    try {
      await apiService.deleteCharacter(characterId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления персонажа");
    }
  };

  const toggleAttach = async (characterId: number) => {
    if (!campaign) return;
    const current = new Set(campaign.characters || []);
    if (current.has(characterId)) {
      current.delete(characterId);
    } else {
      current.add(characterId);
    }
    try {
      const updated = await apiService.updateCampaign(campaign.id, {
        characters: Array.from(current),
      });
      setCampaign(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить кампанию");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Персонажи партии</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {characters.map((character) => {
              const attached = campaign?.characters?.includes(character.id) ?? false;
              return (
                <div key={character.id} className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-amber-100">{character.name}</p>
                      <p className="text-xs text-amber-100/70">
                        {character.character_class_name || "без класса"} · lvl {character.level} · {character.race}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(character)}>
                        Править
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(character.id)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                  {selectedCampaignId && (
                    <Button
                      size="sm"
                      variant={attached ? "secondary" : "outline"}
                      className="mt-2"
                      onClick={() => toggleAttach(character.id)}
                    >
                      {attached ? "Убрать из кампании" : "Добавить в кампанию"}
                    </Button>
                  )}
                </div>
              );
            })}
            {characters.length === 0 && (
              <p className="text-sm text-amber-100/70">Персонажей пока нет.</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">
              {editingId ? "Редактировать персонажа" : "Новый персонаж"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Имя персонажа"
                required
              />
              <div className="space-y-2">
                <Label>Класс</Label>
                <select
                  className="w-full rounded-md border border-amber-700/40 bg-amber-950/60 px-3 py-2 text-sm text-amber-100"
                  value={draft.character_class}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, character_class: Number(event.target.value) }))
                  }
                  required
                >
                  <option value={0} disabled>Выберите класс</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <Input
                type="number"
                min={1}
                value={draft.level}
                onChange={(event) => setDraft((prev) => ({ ...prev, level: Number(event.target.value) }))}
                placeholder="Уровень"
              />
              <Input
                value={draft.race}
                onChange={(event) => setDraft((prev) => ({ ...prev, race: event.target.value }))}
                placeholder="Раса"
                required
              />
              <Input
                value={draft.background}
                onChange={(event) => setDraft((prev) => ({ ...prev, background: event.target.value }))}
                placeholder="Предыстория"
              />
              <Textarea
                value={draft.skills}
                onChange={(event) => setDraft((prev) => ({ ...prev, skills: event.target.value }))}
                placeholder="Навыки"
              />
              <Textarea
                value={draft.equipment}
                onChange={(event) => setDraft((prev) => ({ ...prev, equipment: event.target.value }))}
                placeholder="Снаряжение"
              />
              <Textarea
                value={draft.spells}
                onChange={(event) => setDraft((prev) => ({ ...prev, spells: event.target.value }))}
                placeholder="Заклинания"
              />
              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Сохранить" : "Создать"}</Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setDraft({
                        name: "",
                        character_class: classes[0]?.id ?? 0,
                        level: 1,
                        race: "",
                        background: "",
                        skills: "",
                        equipment: "",
                        spells: "",
                      });
                    }}
                  >
                    Отмена
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
