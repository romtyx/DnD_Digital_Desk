import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiService, type SessionItem } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeskContext {
  selectedCampaignId: number | null;
}

const toLocalInputValue = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoValue = (localValue: string) => new Date(localValue).toISOString();

export function SessionsPage() {
  const { selectedCampaignId } = useOutletContext<DeskContext>();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({
    number: 1,
    date: toLocalInputValue(new Date().toISOString()),
    description: "",
  });

  const load = async () => {
    if (!selectedCampaignId) {
      setSessions([]);
      return;
    }
    setLoading(true);
    try {
      const list = await apiService.listSessions(selectedCampaignId);
      setSessions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить сессии");
    } finally {
      setLoading(false);
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
      const payload = {
        number: Number(draft.number),
        date: toIsoValue(draft.date),
        description: draft.description,
        campaign: selectedCampaignId,
      };
      if (editingId) {
        await apiService.updateSession(editingId, payload);
      } else {
        await apiService.createSession(payload);
      }
      setEditingId(null);
      setDraft({
        number: sessions.length + 1,
        date: toLocalInputValue(new Date().toISOString()),
        description: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const handleEdit = (session: SessionItem) => {
    setEditingId(session.id);
    setDraft({
      number: session.number,
      date: toLocalInputValue(session.date),
      description: session.description,
    });
  };

  const handleDelete = async (sessionId: number) => {
    setError(null);
    try {
      await apiService.deleteSession(sessionId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    }
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
            <CardTitle className="font-display text-xl text-amber-100">Сессии кампании</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-amber-100/70">Загрузка...</p>}
            {!selectedCampaignId && (
              <p className="text-sm text-amber-100/70">Выберите кампанию слева.</p>
            )}
            {sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-amber-100">Сессия {session.number}</p>
                    <p className="text-xs text-amber-100/60">{new Date(session.date).toLocaleString()}</p>
                    {session.description && (
                      <p className="text-xs text-amber-100/70 mt-2">{session.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(session)}>
                      Править
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(session.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && selectedCampaignId && !loading && (
              <p className="text-sm text-amber-100/70">Сессий пока нет.</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">
              {editingId ? "Редактировать сессию" : "Новая сессия"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Данные сессии</Label>
              <Input
                type="number"
                min={1}
                value={draft.number}
                onChange={(event) => setDraft((prev) => ({ ...prev, number: Number(event.target.value) }))}
              />
              <Input
                type="datetime-local"
                value={draft.date}
                onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
              />
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Кратко о сессии"
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
                        number: sessions.length + 1,
                        date: toLocalInputValue(new Date().toISOString()),
                        description: "",
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
