import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiService, type Campaign, type CharacterSheet } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeskContext {
  selectedCampaignId: number | null;
  refreshCampaigns: () => Promise<void>;
}

export function CampaignsPage() {
  const { selectedCampaignId, refreshCampaigns } = useOutletContext<DeskContext>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<CharacterSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    world_story: "",
  });
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [campaignList, characterList] = await Promise.all([
        apiService.listCampaigns(),
        apiService.listCharacters(),
      ]);
      setCampaigns(campaignList);
      setCharacters(characterList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить кампании");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      setSelectedCharacters(selectedCampaign.characters ?? []);
    }
  }, [selectedCampaign]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await apiService.updateCampaign(editingId, {
          ...draft,
          characters: selectedCharacters,
        });
      } else {
        await apiService.createCampaign({
          ...draft,
          characters: selectedCharacters,
        });
      }
      setDraft({ name: "", description: "", world_story: "" });
      setSelectedCharacters([]);
      setEditingId(null);
      await refreshCampaigns();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения кампании");
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setDraft({
      name: campaign.name,
      description: campaign.description,
      world_story: campaign.world_story,
    });
    setSelectedCharacters(campaign.characters ?? []);
  };

  const handleDelete = async (campaignId: number) => {
    setError(null);
    try {
      await apiService.deleteCampaign(campaignId);
      await refreshCampaigns();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления кампании");
    }
  };

  const toggleCharacter = (characterId: number) => {
    setSelectedCharacters((prev) =>
      prev.includes(characterId)
        ? prev.filter((id) => id !== characterId)
        : [...prev, characterId],
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Список кампаний</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-amber-100/70">Загрузка...</p>}
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-amber-100">{campaign.name}</p>
                    <p className="text-xs text-amber-100/60">{campaign.description || "Без описания"}</p>
                    {campaign.characters_detail && campaign.characters_detail.length > 0 && (
                      <p className="text-xs text-amber-100/70 mt-2">
                        Персонажи: {campaign.characters_detail.map((c) => c.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(campaign)}>
                      Править
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(campaign.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && !loading && (
              <p className="text-sm text-amber-100/70">Кампаний пока нет.</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">
              {editingId ? "Редактировать кампанию" : "Новая кампания"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Название кампании"
                required
              />
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Короткое описание"
              />
              <Textarea
                value={draft.world_story}
                onChange={(event) => setDraft((prev) => ({ ...prev, world_story: event.target.value }))}
                placeholder="Линия мира / лор"
              />

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Персонажи</Label>
                <div className="space-y-2">
                  {characters.map((character) => (
                    <label
                      key={character.id}
                      className="flex items-center gap-2 text-sm text-amber-100/80"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCharacters.includes(character.id)}
                        onChange={() => toggleCharacter(character.id)}
                      />
                      {character.name} ({character.character_class_name || "без класса"})
                    </label>
                  ))}
                  {characters.length === 0 && (
                    <p className="text-sm text-amber-100/70">Персонажей пока нет.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Сохранить" : "Создать"}</Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setDraft({ name: "", description: "", world_story: "" });
                      setSelectedCharacters([]);
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
