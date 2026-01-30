import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiService, type ChatMessage, type UserProfile } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface DeskContext {
  selectedCampaignId: number | null;
}

export function ChatPage() {
  const { selectedCampaignId } = useOutletContext<DeskContext>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<UserProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    if (!selectedCampaignId) {
      setMessages([]);
      return;
    }
    try {
      const list = await apiService.listChatMessages(selectedCampaignId);
      setMessages(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить чат");
    }
  };

  useEffect(() => {
    apiService.getMe().then(setMe).catch(() => null);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [selectedCampaignId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCampaignId) {
      setError("Сначала выберите кампанию");
      return;
    }
    if (!draft.trim()) {
      return;
    }
    setError(null);
    try {
      await apiService.sendChatMessage({
        text: draft,
        campaign: selectedCampaignId,
      });
      setDraft("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки сообщения");
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
          <CardTitle className="font-display text-xl text-amber-100">Тавернский чат</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[420px] overflow-y-auto space-y-3">
            {messages.map((msg) => {
              const isMine = me?.id === msg.user;
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl px-3 py-2 text-sm border ${
                    isMine
                      ? "border-amber-400/70 bg-amber-800/40 ml-auto"
                      : "border-amber-700/30 bg-amber-950/50"
                  }`}
                >
                  <p className="text-amber-100/80 text-xs">
                    {msg.user_name} · {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-amber-100">{msg.text}</p>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-sm text-amber-100/70">Чат пуст. Напиши первое сообщение.</p>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Сообщение для партии"
              rows={3}
            />
            <Button type="submit">Отправить</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
