import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  apiService,
  type Campaign,
  type CharacterClass,
  type CharacterSheet,
  type DMNote,
  type SessionItem,
  type UserProfile,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const toLocalInputValue = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIsoValue = (localValue: string) => {
  const date = new Date(localValue);
  return date.toISOString();
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [notes, setNotes] = useState<DMNote[]>([]);
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [characters, setCharacters] = useState<CharacterSheet[]>([]);

  const [campaignDraft, setCampaignDraft] = useState({
    name: "",
    description: "",
    world_story: "",
  });
  const [campaignEditingId, setCampaignEditingId] = useState<number | null>(null);

  const [sessionDraft, setSessionDraft] = useState(() => ({
    number: 1,
    date: toLocalInputValue(new Date().toISOString()),
    description: "",
  }));
  const [sessionEditingId, setSessionEditingId] = useState<number | null>(null);

  const [noteDraft, setNoteDraft] = useState({
    text: "",
  });
  const [noteEditingId, setNoteEditingId] = useState<number | null>(null);
  const [characterDraft, setCharacterDraft] = useState({
    name: "",
    character_class: 0,
    level: 1,
    race: "",
    background: "",
    equipment: "",
    skills: "",
    spells: "",
  });
  const [characterEditingId, setCharacterEditingId] = useState<number | null>(null);

  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeCharacters = Array.isArray(characters) ? characters : [];

  const selectedCampaign = useMemo(
    () => safeCampaigns.find((item) => item.id === selectedCampaignId) || null,
    [safeCampaigns, selectedCampaignId],
  );
  const selectedSession = useMemo(
    () => safeSessions.find((item) => item.id === selectedSessionId) || null,
    [safeSessions, selectedSessionId],
  );

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [me, campaignList, classList, characterList] = await Promise.all([
          apiService.getMe(),
          apiService.listCampaigns(),
          apiService.listClasses(),
          apiService.listCharacters(),
        ]);
        setUser(me);
        setCampaigns(campaignList);
        setClasses(classList);
        setCharacters(characterList);
        const firstCampaignId = campaignList[0]?.id ?? null;
        if (!selectedCampaignId || !campaignList.some((item) => item.id === selectedCampaignId)) {
          setSelectedCampaignId(firstCampaignId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, selectedCampaignId]);

  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedCampaignId) {
        setSessions([]);
        setSelectedSessionId(null);
        return;
      }
      try {
        const sessionList = await apiService.listSessions(selectedCampaignId);
        sessionList.sort((a, b) => a.number - b.number);
        setSessions(sessionList);
        const firstSessionId = sessionList[0]?.id ?? null;
        if (!selectedSessionId || !sessionList.some((item) => item.id === selectedSessionId)) {
          setSelectedSessionId(firstSessionId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить сессии");
      }
    };

    loadSessions();
  }, [selectedCampaignId, selectedSessionId]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!selectedSessionId) {
        setNotes([]);
        return;
      }
      try {
        const noteList = await apiService.listNotes(selectedSessionId);
        setNotes(noteList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить заметки");
      }
    };

    loadNotes();
  }, [selectedSessionId]);

  useEffect(() => {
    if (!characterDraft.character_class && safeClasses.length > 0) {
      setCharacterDraft((prev) => ({ ...prev, character_class: safeClasses[0].id }));
    }
  }, [safeClasses, characterDraft.character_class]);

  const handleLogout = () => {
    apiService.logout();
    navigate("/");
  };

  const handleCampaignSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (campaignEditingId) {
        const updated = await apiService.updateCampaign(campaignEditingId, campaignDraft);
        setCampaigns((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setCampaignEditingId(null);
      } else {
        const created = await apiService.createCampaign(campaignDraft);
        setCampaigns((prev) => [...prev, created]);
        setSelectedCampaignId(created.id);
      }
      setCampaignDraft({ name: "", description: "", world_story: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения кампании");
    }
  };

  const handleCampaignEdit = (campaign: Campaign) => {
    setCampaignEditingId(campaign.id);
    setCampaignDraft({
      name: campaign.name,
      description: campaign.description,
      world_story: campaign.world_story,
    });
  };

  const handleCampaignDelete = async (campaignId: number) => {
    setError(null);
    try {
      await apiService.deleteCampaign(campaignId);
      setCampaigns((prev) => {
        const next = prev.filter((item) => item.id !== campaignId);
        if (selectedCampaignId === campaignId) {
          const nextId = next[0]?.id ?? null;
          setSelectedCampaignId(nextId);
          setSessions([]);
          setSelectedSessionId(null);
          setNotes([]);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления кампании");
    }
  };

  const handleSessionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!selectedCampaignId) {
      setError("Сначала выберите кампанию");
      return;
    }
    try {
      const payload = {
        number: Number(sessionDraft.number),
        date: toIsoValue(sessionDraft.date),
        description: sessionDraft.description,
        campaign: selectedCampaignId,
      };
      if (sessionEditingId) {
        const updated = await apiService.updateSession(sessionEditingId, payload);
        setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSessionEditingId(null);
      } else {
        const created = await apiService.createSession(payload);
        setSessions((prev) => [...prev, created]);
        setSelectedSessionId(created.id);
      }
      setSessionDraft({
        number: sessions.length + 1,
        date: toLocalInputValue(new Date().toISOString()),
        description: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения сессии");
    }
  };

  const handleSessionEdit = (session: SessionItem) => {
    setSessionEditingId(session.id);
    setSessionDraft({
      number: session.number,
      date: toLocalInputValue(session.date),
      description: session.description,
    });
    setSelectedSessionId(session.id);
  };

  const handleSessionDelete = async (sessionId: number) => {
    setError(null);
    try {
      await apiService.deleteSession(sessionId);
      setSessions((prev) => {
        const next = prev.filter((item) => item.id !== sessionId);
        if (selectedSessionId === sessionId) {
          const nextId = next[0]?.id ?? null;
          setSelectedSessionId(nextId);
          setNotes([]);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления сессии");
    }
  };

  const handleNoteSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!selectedSessionId) {
      setError("Сначала выберите сессию");
      return;
    }
    try {
      const payload = {
        text: noteDraft.text,
        session: selectedSessionId,
      };
      if (noteEditingId) {
        const updated = await apiService.updateNote(noteEditingId, payload);
        setNotes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setNoteEditingId(null);
      } else {
        const created = await apiService.createNote(payload);
        setNotes((prev) => [...prev, created]);
      }
      setNoteDraft({ text: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения заметки");
    }
  };

  const handleNoteEdit = (note: DMNote) => {
    setNoteEditingId(note.id);
    setNoteDraft({ text: note.text });
  };

  const handleNoteDelete = async (noteId: number) => {
    setError(null);
    try {
      await apiService.deleteNote(noteId);
      setNotes((prev) => prev.filter((item) => item.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления заметки");
    }
  };

  const handleCharacterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!characterDraft.character_class) {
      setError("Выберите класс персонажа");
      return;
    }
    if (!characterDraft.name.trim()) {
      setError("Укажите имя персонажа");
      return;
    }
    try {
      const payload = {
        name: characterDraft.name,
        character_class: characterDraft.character_class,
        level: Number(characterDraft.level) || 1,
        race: characterDraft.race,
        background: characterDraft.background,
        equipment: characterDraft.equipment,
        skills: characterDraft.skills,
        spells: characterDraft.spells,
      };
      if (characterEditingId) {
        const updated = await apiService.updateCharacter(characterEditingId, payload);
        setCharacters((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setCharacterEditingId(null);
      } else {
        const created = await apiService.createCharacter(payload);
        setCharacters((prev) => [...prev, created]);
      }
      setCharacterDraft({
        name: "",
        character_class: safeClasses[0]?.id ?? 0,
        level: 1,
        race: "",
        background: "",
        equipment: "",
        skills: "",
        spells: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения персонажа");
    }
  };

  const handleCharacterEdit = (character: CharacterSheet) => {
    setCharacterEditingId(character.id);
    setCharacterDraft({
      name: character.name,
      character_class: character.character_class,
      level: character.level,
      race: character.race,
      background: character.background,
      equipment: character.equipment,
      skills: character.skills,
      spells: character.spells,
    });
  };

  const handleCharacterDelete = async (characterId: number) => {
    setError(null);
    try {
      await apiService.deleteCharacter(characterId);
      setCharacters((prev) => prev.filter((item) => item.id !== characterId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления персонажа");
    }
  };

  if (loading) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-amber-700/40 bg-amber-950/70 px-6 py-4 shadow-lg text-amber-100">
          Загрузка кабинета...
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen">
      <header className="container mx-auto px-6 pt-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl border border-amber-500/40 bg-amber-200/10 text-amber-100 flex items-center justify-center shadow-sm font-display">
            DD
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-100/60">Кабинет мастера</p>
            <p className="text-sm text-amber-100/80">{user?.username}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-amber-100/70">{user?.email}</span>
          <Button variant="outline" onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">
                Кампании
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {safeCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      campaign.id === selectedCampaignId
                        ? "border-amber-400/70 bg-amber-800/40"
                        : "border-amber-700/30 bg-amber-950/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      className="w-full text-left"
                    >
                      <p className="font-medium text-amber-100">{campaign.name}</p>
                      <p className="text-amber-100/60 text-xs">{campaign.description || "Без описания"}</p>
                    </button>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleCampaignEdit(campaign)}>
                        Править
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleCampaignDelete(campaign.id)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCampaignSubmit} className="space-y-3">
                <Label className="text-xs uppercase tracking-[0.35em] text-amber-100/60">
                  {campaignEditingId ? "Редактирование" : "Новая кампания"}
                </Label>
                <Input
                  value={campaignDraft.name}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Название кампании"
                  required
                />
                <Textarea
                  value={campaignDraft.description}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Короткое описание"
                />
                <Textarea
                  value={campaignDraft.world_story}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, world_story: event.target.value }))}
                  placeholder="Сюжетный фон"
                />
                <div className="flex gap-2">
                  <Button type="submit">
                    {campaignEditingId ? "Сохранить" : "Создать"}
                  </Button>
                  {campaignEditingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCampaignEditingId(null);
                        setCampaignDraft({ name: "", description: "", world_story: "" });
                      }}
                    >
                      Отмена
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">
                Сессии
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCampaign ? (
                <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">
                  Кампания: {selectedCampaign.name}
                </p>
              ) : (
                <p className="text-sm text-amber-100/70">Выберите кампанию слева.</p>
              )}

              <div className="space-y-2">
                {safeSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      session.id === selectedSessionId
                        ? "border-amber-400/70 bg-amber-800/40"
                        : "border-amber-700/30 bg-amber-950/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className="w-full text-left"
                    >
                      <p className="font-medium text-amber-100">
                        Сессия {session.number}
                      </p>
                      <p className="text-amber-100/60 text-xs">
                        {new Date(session.date).toLocaleString()}
                      </p>
                    </button>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleSessionEdit(session)}>
                        Править
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleSessionDelete(session.id)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSessionSubmit} className="space-y-3">
                <Label className="text-xs uppercase tracking-[0.35em] text-amber-100/60">
                  {sessionEditingId ? "Редактирование" : "Новая сессия"}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={sessionDraft.number}
                  onChange={(event) =>
                    setSessionDraft((prev) => ({
                      ...prev,
                      number: Number(event.target.value),
                    }))
                  }
                  placeholder="Номер"
                  required
                />
                <Input
                  type="datetime-local"
                  value={sessionDraft.date}
                  onChange={(event) =>
                    setSessionDraft((prev) => ({ ...prev, date: event.target.value }))
                  }
                  required
                />
                <Textarea
                  value={sessionDraft.description}
                  onChange={(event) =>
                    setSessionDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Кратко о сессии"
                />
                <div className="flex gap-2">
                  <Button type="submit">
                    {sessionEditingId ? "Сохранить" : "Создать"}
                  </Button>
                  {sessionEditingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSessionEditingId(null);
                        setSessionDraft({
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

          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">
                Журнал сессии
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSession ? (
                <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">
                  Сессия {selectedSession.number}
                </p>
              ) : (
                <p className="text-sm text-amber-100/70">Выберите сессию.</p>
              )}

              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2 text-sm">
                    <p className="text-amber-100">{note.text}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleNoteEdit(note)}>
                        Править
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleNoteDelete(note.id)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleNoteSubmit} className="space-y-3">
                <Label className="text-xs uppercase tracking-[0.35em] text-amber-100/60">
                  {noteEditingId ? "Редактирование" : "Новая запись"}
                </Label>
                <Textarea
                  value={noteDraft.text}
                  onChange={(event) => setNoteDraft({ text: event.target.value })}
                  placeholder="Запись хода сессии"
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit">
                    {noteEditingId ? "Сохранить" : "Добавить"}
                  </Button>
                  {noteEditingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setNoteEditingId(null);
                        setNoteDraft({ text: "" });
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

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">
                Персонажи партии
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {safeCharacters.map((character) => (
                  <div
                    key={character.id}
                    className="rounded-xl border border-amber-700/30 bg-amber-950/40 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-amber-100">{character.name}</p>
                        <p className="text-amber-100/60 text-xs">
                          {character.character_class_name || "Без класса"} · {character.race || "Раса?"} · lvl {character.level}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCharacterEdit(character)}>
                          Править
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCharacterDelete(character.id)}>
                          Удалить
                        </Button>
                      </div>
                    </div>
                    {character.background && (
                      <p className="text-amber-100/70 text-xs mt-2">Фон: {character.background}</p>
                    )}
                  </div>
                ))}
                {safeCharacters.length === 0 && (
                  <p className="text-sm text-amber-100/70">Персонажей пока нет.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">
                Создать персонажа
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCharacterSubmit} className="space-y-3">
                <Label className="text-xs uppercase tracking-[0.35em] text-amber-100/60">
                  {characterEditingId ? "Редактирование" : "Новый персонаж"}
                </Label>
                <Input
                  value={characterDraft.name}
                  onChange={(event) => setCharacterDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Имя персонажа"
                  required
                />
                <div className="space-y-2">
                  <Label>Класс</Label>
                  <select
                    className="w-full rounded-md border border-amber-700/40 bg-amber-950/60 px-3 py-2 text-sm text-amber-100"
                    value={characterDraft.character_class}
                    onChange={(event) =>
                      setCharacterDraft((prev) => ({
                        ...prev,
                        character_class: Number(event.target.value),
                      }))
                    }
                    required
                  >
                    <option value={0} disabled>
                      Выберите класс
                    </option>
                    {safeClasses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={characterDraft.level}
                  onChange={(event) => setCharacterDraft((prev) => ({ ...prev, level: Number(event.target.value) }))}
                  placeholder="Уровень"
                />
                <Input
                  value={characterDraft.race}
                  onChange={(event) => setCharacterDraft((prev) => ({ ...prev, race: event.target.value }))}
                  placeholder="Раса"
                  required
                />
                <Input
                  value={characterDraft.background}
                  onChange={(event) => setCharacterDraft((prev) => ({ ...prev, background: event.target.value }))}
                  placeholder="Предыстория"
                />
                <Textarea
                  value={characterDraft.skills}
                  onChange={(event) => setCharacterDraft((prev) => ({ ...prev, skills: event.target.value }))}
                  placeholder="Навыки"
                />
                <Textarea
                  value={characterDraft.equipment}
                  onChange={(event) => setCharacterDraft((prev) => ({ ...prev, equipment: event.target.value }))}
                  placeholder="Снаряжение"
                />
                <Textarea
                  value={characterDraft.spells}
                  onChange={(event) => setCharacterDraft((prev) => ({ ...prev, spells: event.target.value }))}
                  placeholder="Заклинания"
                />
                <div className="flex gap-2">
                  <Button type="submit">
                    {characterEditingId ? "Сохранить" : "Добавить"}
                  </Button>
                  {characterEditingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCharacterEditingId(null);
                        setCharacterDraft({
                          name: "",
                          character_class: safeClasses[0]?.id ?? 0,
                          level: 1,
                          race: "",
                          background: "",
                          equipment: "",
                          skills: "",
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
      </main>
    </div>
  );
}
