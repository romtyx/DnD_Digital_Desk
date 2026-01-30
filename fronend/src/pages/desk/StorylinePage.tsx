import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiService, type Storyline, type StoryOutcome } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeskContext {
  selectedCampaignId: number | null;
}

export function StorylinePage() {
  const { selectedCampaignId } = useOutletContext<DeskContext>();
  const [storylines, setStorylines] = useState<Storyline[]>([]);
  const [outcomes, setOutcomes] = useState<Record<number, StoryOutcome[]>>({});
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    title: "",
    summary: "",
    order: 1,
  });

  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<number, { title: string; condition: string; description: string }>>({});

  const load = async () => {
    if (!selectedCampaignId) {
      setStorylines([]);
      setOutcomes({});
      return;
    }
    try {
      const list = await apiService.listStorylines(selectedCampaignId);
      setStorylines(list);
      const outcomeEntries: Record<number, StoryOutcome[]> = {};
      for (const line of list) {
        outcomeEntries[line.id] = await apiService.listStoryOutcomes(line.id);
      }
      setOutcomes(outcomeEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить сюжет");
    }
  };

  useEffect(() => {
    load();
  }, [selectedCampaignId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCampaignId) {
      setError("Сначала выберите кампанию");
      return;
    }
    setError(null);
    try {
      await apiService.createStoryline({
        ...draft,
        campaign: selectedCampaignId,
      });
      setDraft({ title: "", summary: "", order: storylines.length + 1 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения линии сюжета");
    }
  };

  const handleDeleteStoryline = async (id: number) => {
    setError(null);
    try {
      await apiService.deleteStoryline(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления линии сюжета");
    }
  };

  const handleOutcomeSubmit = async (storylineId: number) => {
    const draftOutcome = outcomeDrafts[storylineId];
    if (!draftOutcome || !draftOutcome.title.trim()) {
      setError("Заполните название исхода");
      return;
    }
    setError(null);
    try {
      await apiService.createStoryOutcome({
        title: draftOutcome.title,
        condition: draftOutcome.condition,
        description: draftOutcome.description,
        order: outcomes[storylineId]?.length ? outcomes[storylineId].length + 1 : 1,
        storyline: storylineId,
      });
      setOutcomeDrafts((prev) => ({
        ...prev,
        [storylineId]: { title: "", condition: "", description: "" },
      }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения исхода");
    }
  };

  const handleDeleteOutcome = async (outcomeId: number) => {
    setError(null);
    try {
      await apiService.deleteStoryOutcome(outcomeId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления исхода");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Линия сюжета</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {storylines.map((line) => (
              <div key={line.id} className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-amber-100">{line.order}. {line.title}</p>
                    {line.summary && (
                      <p className="text-xs text-amber-100/70 mt-1">{line.summary}</p>
                    )}
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteStoryline(line.id)}>
                    Удалить
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Исходы</p>
                  {(outcomes[line.id] || []).map((outcome) => (
                    <div key={outcome.id} className="rounded-lg border border-amber-700/30 bg-amber-950/50 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-amber-100">{outcome.order}. {outcome.title}</p>
                          {outcome.condition && (
                            <p className="text-xs text-amber-100/70 mt-1">Условие: {outcome.condition}</p>
                          )}
                          {outcome.description && (
                            <p className="text-xs text-amber-100/70 mt-1">{outcome.description}</p>
                          )}
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteOutcome(outcome.id)}>
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 space-y-2">
                    <Input
                      value={outcomeDrafts[line.id]?.title || ""}
                      onChange={(event) =>
                        setOutcomeDrafts((prev) => ({
                          ...prev,
                          [line.id]: {
                            title: event.target.value,
                            condition: prev[line.id]?.condition || "",
                            description: prev[line.id]?.description || "",
                          },
                        }))
                      }
                      placeholder="Название исхода"
                    />
                    <Input
                      value={outcomeDrafts[line.id]?.condition || ""}
                      onChange={(event) =>
                        setOutcomeDrafts((prev) => ({
                          ...prev,
                          [line.id]: {
                            title: prev[line.id]?.title || "",
                            condition: event.target.value,
                            description: prev[line.id]?.description || "",
                          },
                        }))
                      }
                      placeholder="Условие (например: если игроки не договорились)"
                    />
                    <Textarea
                      value={outcomeDrafts[line.id]?.description || ""}
                      onChange={(event) =>
                        setOutcomeDrafts((prev) => ({
                          ...prev,
                          [line.id]: {
                            title: prev[line.id]?.title || "",
                            condition: prev[line.id]?.condition || "",
                            description: event.target.value,
                          },
                        }))
                      }
                      placeholder="Описание исхода"
                    />
                    <Button type="button" onClick={() => handleOutcomeSubmit(line.id)}>
                      Добавить исход
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {storylines.length === 0 && (
              <p className="text-sm text-amber-100/70">Сюжет пока пуст.</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Новая линия</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Событие</Label>
              <Input
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Название события"
                required
              />
              <Textarea
                value={draft.summary}
                onChange={(event) => setDraft((prev) => ({ ...prev, summary: event.target.value }))}
                placeholder="Описание / заготовка"
              />
              <Input
                type="number"
                min={1}
                value={draft.order}
                onChange={(event) => setDraft((prev) => ({ ...prev, order: Number(event.target.value) }))}
                placeholder="Порядок"
              />
              <Button type="submit">Добавить</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
