import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  apiService,
  type Campaign,
  type CampaignJoinRequest,
  type CharacterSheet,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeskContext {
  selectedCampaignId: number | null;
  refreshCampaigns: () => Promise<void>;
  selectedCampaign: Campaign | null;
}

const defaultDraft = {
  name: "",
  description: "",
  world_story: "",
  is_public: true,
  max_players: 4,
  is_archived: false,
};

export function CampaignsPage() {
  const { refreshCampaigns } = useOutletContext<DeskContext>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<CharacterSheet[]>([]);
  const [publicCampaigns, setPublicCampaigns] = useState<Campaign[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<CampaignJoinRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<CampaignJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [draft, setDraft] = useState(defaultDraft);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [joinCharacterId, setJoinCharacterId] = useState<number | null>(null);
  const [publicSearch, setPublicSearch] = useState("");

  const ownedCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.is_owner && !campaign.is_archived),
    [campaigns],
  );
  const joinedCampaigns = useMemo(
    () => campaigns.filter((campaign) => !campaign.is_owner && !campaign.is_archived),
    [campaigns],
  );
  const archivedCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.is_archived),
    [campaigns],
  );

  const incomingByCampaign = useMemo(() => {
    const map = new Map<number, CampaignJoinRequest[]>();
    incomingRequests.forEach((request) => {
      const list = map.get(request.campaign) ?? [];
      list.push(request);
      map.set(request.campaign, list);
    });
    return map;
  }, [incomingRequests]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignList, characterList, incoming, outgoing] = await Promise.all([
        apiService.listCampaigns(),
        apiService.listCharacters(),
        apiService.listCampaignRequests({ scope: "incoming", status: "pending" }),
        apiService.listCampaignRequests({ scope: "outgoing", status: "pending" }),
      ]);
      setCampaigns(campaignList);
      setCharacters(characterList);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить кампании");
    } finally {
      setLoading(false);
    }
  };

  const loadPublic = async (query = "") => {
    try {
      const list = await apiService.listPublicCampaigns(query);
      setPublicCampaigns(list);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Не удалось загрузить публичные кампании");
    }
  };

  useEffect(() => {
    load();
    loadPublic("");
  }, []);

  useEffect(() => {
    if (!joinCharacterId && characters.length > 0) {
      setJoinCharacterId(characters[0].id);
    }
  }, [joinCharacterId, characters]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = {
        ...draft,
        max_players: Number(draft.max_players) || 1,
      };
      if (editingId) {
        await apiService.updateCampaign(editingId, payload);
      } else {
        await apiService.createCampaign(payload);
      }
      setDraft(defaultDraft);
      setEditingId(null);
      await refreshCampaigns();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения кампании");
    }
  };

  const handleEdit = (campaign: Campaign) => {
    if (!campaign.is_owner) return;
    setEditingId(campaign.id);
    setDraft({
      name: campaign.name,
      description: campaign.description,
      world_story: campaign.world_story,
      is_public: campaign.is_public,
      max_players: campaign.max_players,
      is_archived: campaign.is_archived,
    });
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

  const handleJoinByCode = async () => {
    setJoinError(null);
    if (!joinCharacterId) {
      setJoinError("Сначала выберите персонажа");
      return;
    }
    if (!joinCode.trim()) {
      setJoinError("Введите код кампании");
      return;
    }
    try {
      await apiService.createCampaignRequest({
        code: joinCode.trim(),
        character: joinCharacterId,
      });
      setJoinCode("");
      await load();
      await loadPublic(publicSearch);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Не удалось отправить заявку");
    }
  };

  const handleJoinPublic = async (campaignId: number) => {
    setJoinError(null);
    if (!joinCharacterId) {
      setJoinError("Сначала выберите персонажа");
      return;
    }
    try {
      await apiService.createCampaignRequest({
        campaign: campaignId,
        character: joinCharacterId,
      });
      await load();
      await loadPublic(publicSearch);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Не удалось отправить заявку");
    }
  };

  const handleApprove = async (requestId: number) => {
    setError(null);
    try {
      await apiService.approveCampaignRequest(requestId);
      await load();
      await refreshCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось принять заявку");
    }
  };

  const handleReject = async (requestId: number) => {
    setError(null);
    try {
      await apiService.rejectCampaignRequest(requestId);
      await load();
      await refreshCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отклонить заявку");
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
            <CardTitle className="font-display text-xl text-amber-100">Присоединиться к кампании</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {joinError && (
              <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                {joinError}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Персонаж</Label>
              <select
                className="w-full rounded-md border border-amber-700/40 bg-amber-950/60 px-3 py-2 text-sm text-amber-100"
                value={joinCharacterId ?? 0}
                onChange={(event) => setJoinCharacterId(Number(event.target.value))}
                disabled={characters.length === 0}
              >
                <option value={0} disabled>
                  Выберите персонажа
                </option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name} ({character.character_class_name || "без класса"})
                  </option>
                ))}
              </select>
              {characters.length === 0 && (
                <p className="text-xs text-amber-100/70">
                  Сначала создайте персонажа во вкладке «Персонажи».
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Код приватной кампании</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder="Например: A7X9Q2"
                />
                <Button onClick={handleJoinByCode}>Отправить заявку</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Публичные кампании</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={publicSearch}
                  onChange={(event) => setPublicSearch(event.target.value)}
                  placeholder="Поиск по названию или описанию"
                />
                <Button variant="outline" onClick={() => loadPublic(publicSearch)}>
                  Найти
                </Button>
              </div>
              <div className="space-y-2">
                {publicCampaigns.map((campaign) => {
                  const playersCount = campaign.players_count ?? 0;
                  const isFull = playersCount >= campaign.max_players;
                  const status = campaign.my_request_status;
                  const isOwner = campaign.is_owner;
                  let buttonLabel = "Отправить заявку";
                  if (isOwner) buttonLabel = "Вы мастер";
                  else if (status === "pending") buttonLabel = "Заявка отправлена";
                  else if (status === "accepted") buttonLabel = "Вы уже игрок";
                  else if (isFull) buttonLabel = "Мест нет";

                  const disableJoin = Boolean(isOwner || status || isFull || characters.length === 0);

                  return (
                    <div
                      key={campaign.id}
                      className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-amber-100">{campaign.name}</p>
                          <p className="text-xs text-amber-100/60">{campaign.description || "Без описания"}</p>
                          <p className="text-xs text-amber-100/60 mt-1">
                            Ведет: {campaign.owner_name || "Мастер"} · Игроков {playersCount}/{campaign.max_players}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" disabled={disableJoin} onClick={() => handleJoinPublic(campaign.id)}>
                          {buttonLabel}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {publicCampaigns.length === 0 && (
                  <p className="text-xs text-amber-100/70">Публичных кампаний не найдено.</p>
                )}
              </div>
            </div>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Доступ</Label>
                  <select
                    className="w-full rounded-md border border-amber-700/40 bg-amber-950/60 px-3 py-2 text-sm text-amber-100"
                    value={draft.is_public ? "public" : "private"}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, is_public: event.target.value === "public" }))
                    }
                  >
                    <option value="public">Публичная</option>
                    <option value="private">Приватная</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Игроков</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.max_players}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, max_players: Number(event.target.value) }))
                    }
                  />
                </div>
              </div>

              {editingId && (
                <label className="flex items-center gap-2 text-sm text-amber-100/80">
                  <input
                    type="checkbox"
                    checked={draft.is_archived}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, is_archived: event.target.checked }))
                    }
                  />
                  Архивировать кампанию
                </label>
              )}

              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Сохранить" : "Создать"}</Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setDraft(defaultDraft);
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Созданные кампании</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-amber-100/70">Загрузка...</p>}
            {ownedCampaigns.map((campaign) => {
              const pending = incomingByCampaign.get(campaign.id) ?? [];
              return (
                <div
                  key={campaign.id}
                  className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-amber-100">{campaign.name}</p>
                      <p className="text-xs text-amber-100/60">{campaign.description || "Без описания"}</p>
                      <p className="text-xs text-amber-100/60 mt-1">
                        {campaign.is_public ? "Публичная" : "Приватная"} · Игроков {campaign.players_count ?? 0}/
                        {campaign.max_players}
                      </p>
                      {!campaign.is_public && campaign.join_code && (
                        <p className="text-xs text-amber-100/70 mt-1">Код: {campaign.join_code}</p>
                      )}
                      {campaign.players && campaign.players.length > 0 && (
                        <p className="text-xs text-amber-100/70 mt-2">
                          Игроки: {campaign.players.map((player) => `${player.username} (${player.character_name})`).join(", ")}
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

                  {pending.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Заявки</p>
                      {pending.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-lg border border-amber-700/30 bg-amber-950/50 px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-amber-100">
                                {request.user_name} · {request.character_name}
                              </p>
                              <p className="text-xs text-amber-100/60">
                                {request.character_class_name || "без класса"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleApprove(request.id)}>
                                Принять
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                                Отклонить
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {ownedCampaigns.length === 0 && !loading && (
              <p className="text-sm text-amber-100/70">Вы еще не создали кампании.</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Кампании с запросом</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outgoingRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2"
              >
                <p className="font-medium text-amber-100">{request.campaign_name}</p>
                <p className="text-xs text-amber-100/60">
                  Мастер: {request.campaign_owner_name || "Мастер"} · Персонаж: {request.character_name}
                </p>
              </div>
            ))}
            {outgoingRequests.length === 0 && (
              <p className="text-sm text-amber-100/70">Нет активных заявок.</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Где вы игрок</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {joinedCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2"
              >
                <p className="font-medium text-amber-100">{campaign.name}</p>
                <p className="text-xs text-amber-100/60">
                  Ведет: {campaign.owner_name || "Мастер"} · Игроков {campaign.players_count ?? 0}/{campaign.max_players}
                </p>
              </div>
            ))}
            {joinedCampaigns.length === 0 && (
              <p className="text-sm text-amber-100/70">Вы пока не участвуете в чужих кампаниях.</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Архив</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {archivedCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2"
              >
                <p className="font-medium text-amber-100">{campaign.name}</p>
                <p className="text-xs text-amber-100/60">
                  {campaign.is_owner ? "Ваша кампания" : "Вы игрок"} · Игроков {campaign.players_count ?? 0}/{campaign.max_players}
                </p>
              </div>
            ))}
            {archivedCampaigns.length === 0 && (
              <p className="text-sm text-amber-100/70">Архив пуст.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
