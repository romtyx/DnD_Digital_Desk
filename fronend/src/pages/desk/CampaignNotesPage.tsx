import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiService, type CampaignNote } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface DeskContext {
  selectedCampaignId: number | null;
}

export function CampaignNotesPage() {
  const { selectedCampaignId } = useOutletContext<DeskContext>();
  const [notes, setNotes] = useState<CampaignNote[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!selectedCampaignId) {
      setNotes([]);
      return;
    }
    try {
      const list = await apiService.listCampaignNotes(selectedCampaignId);
      setNotes(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить заметки");
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
    if (!draft.trim()) {
      setError("Введите текст заметки");
      return;
    }
    setError(null);
    try {
      await apiService.createCampaignNote({ text: draft, campaign: selectedCampaignId });
      setDraft("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения заметки");
    }
  };

  const handleDelete = async (noteId: number) => {
    setError(null);
    try {
      await apiService.deleteCampaignNote(noteId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления заметки");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Card className="pixel-panel">
        <CardHeader>
          <CardTitle className="font-display text-xl text-amber-100">Заметки мастера</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-amber-100">{note.text}</p>
                  <p className="text-xs text-amber-100/60 mt-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(note.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <p className="text-sm text-amber-100/70">Пока нет заметок.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Запись мастера"
            />
            <Button type="submit">Добавить заметку</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
