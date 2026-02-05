import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { APITester } from "../APITester";
import { apiService, type Campaign } from "@/services/api";

export function HomePage() {
  const isAuthenticated = apiService.isAuthenticated();
  const [publicCampaigns, setPublicCampaigns] = useState<Campaign[]>([]);
  const [publicError, setPublicError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await apiService.listPublicCampaigns();
        setPublicCampaigns(list);
      } catch (err) {
        setPublicError(err instanceof Error ? err.message : "Не удалось загрузить публичные кампании");
      }
    };
    load();
  }, []);

  return (
    <div className="page-shell min-h-screen">
      <header className="container mx-auto px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl border border-amber-500/40 bg-amber-200/10 text-amber-100 flex items-center justify-center shadow-sm font-display">
            DD
          </div>
          <div className="leading-tight">
            <p className="text-sm tracking-[0.25em] uppercase text-amber-100/70">
              DnD Digital Desk
            </p>
            <p className="text-xs text-muted-foreground">
              Панель мастера и заметки кампаний
            </p>
          </div>
        </Link>
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild className="shadow-lg shadow-amber-900/30">
                <Link to="/desk/campaigns">Открыть кабинет</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/login">Войти</Link>
                </Button>
                <Button asChild className="shadow-lg shadow-amber-900/30">
                  <Link to="/register">Начать кампанию</Link>
                </Button>
              </>
            )}
          </nav>
      </header>

      <main className="container mx-auto px-6 pb-16 pt-10">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
          <section className="space-y-8 animate-[fadeIn_0.8s_ease-out]">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-700/40 bg-amber-900/40 px-4 py-2 text-xs uppercase tracking-[0.35em] text-amber-100/80">
              Подготовка сессий
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight text-amber-100">
                Управляй кампаниями,
                <br />
                веди хроники,
                <br />
                держи ритм партии.
              </h1>
              <p className="text-lg text-amber-100/70 max-w-xl">
                DnD Digital Desk — это компактный рабочий стол мастера: кампании,
                сессии и заметки под рукой. Никаких лишних выкрутасов — только
                удобство.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg" className="shadow-lg shadow-amber-900/30">
                  <Link to="/desk/campaigns">Перейти в кабинет</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="shadow-lg shadow-amber-900/30">
                    <Link to="/register">Создать кабинет</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/login">У меня уже есть аккаунт</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Кампании", value: "1+ активных" },
                { label: "Сессии", value: "2 готовых" },
                { label: "Заметки", value: "структура" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-amber-700/40 bg-amber-900/40 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">
                    {item.label}
                  </p>
                  <p className="font-display text-2xl text-amber-100">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <Card className="rounded-3xl border-amber-700/40 bg-amber-950/70 shadow-xl shadow-amber-900/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display text-2xl text-amber-100">
                  Сцена ближайшей сессии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-amber-100/70">
                <div className="rounded-2xl border border-amber-700/40 bg-amber-900/40 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">
                    Кампания
                  </p>
                  <p className="text-lg text-amber-100">
                    Приключение в Штормграде
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-xl border border-amber-700/40 bg-amber-900/40 px-4 py-3">
                    <span>Подготовка сцен</span>
                    <span className="text-amber-100">3/5</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-amber-700/40 bg-amber-900/40 px-4 py-3">
                    <span>NPC и заметки</span>
                    <span className="text-amber-100">9</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-amber-700/40 bg-amber-900/40 px-4 py-3">
                    <span>Сюжетные крючки</span>
                    <span className="text-amber-100">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl border border-amber-700/40 bg-[#1a120b] text-amber-50 p-6 shadow-xl shadow-amber-900/30">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">
                Быстрые действия
              </p>
              <h3 className="font-display text-2xl mt-3">
                Подготовь встречу за 10 минут.
              </h3>
              <p className="text-sm text-amber-100/80 mt-2">
                Добавляй заметки по горячим следам и держи все арки в одном месте.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="rounded-full bg-amber-50/10 px-3 py-1 text-xs">
                  Шаблоны сцен
                </span>
                <span className="rounded-full bg-amber-50/10 px-3 py-1 text-xs">
                  Быстрые заметки
                </span>
                <span className="rounded-full bg-amber-50/10 px-3 py-1 text-xs">
                  История кампании
                </span>
              </div>
            </div>

            <Card className="rounded-3xl border-amber-700/40 bg-amber-950/70 shadow-xl shadow-amber-900/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display text-2xl text-amber-100">
                  Публичные кампании
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-amber-100/70">
                {publicError && (
                  <p className="text-red-200/80">{publicError}</p>
                )}
                {publicCampaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-2xl border border-amber-700/40 bg-amber-900/40 p-3"
                  >
                    <p className="text-amber-100 font-medium">{campaign.name}</p>
                    <p className="text-xs text-amber-100/60">
                      {campaign.description || "Без описания"}
                    </p>
                    <p className="text-xs text-amber-100/60 mt-1">
                      Игроков {campaign.players_count ?? 0}/{campaign.max_players}
                    </p>
                  </div>
                ))}
                {publicCampaigns.length === 0 && !publicError && (
                  <p className="text-amber-100/60">Публичных кампаний пока нет.</p>
                )}
                <div className="pt-2">
                  {isAuthenticated ? (
                    <Button asChild variant="outline">
                      <Link to="/desk/campaigns">Присоединиться</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link to="/login">Войти для участия</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <details className="rounded-2xl border border-amber-700/40 bg-amber-950/50 p-4 text-sm text-amber-100/70">
              <summary className="cursor-pointer font-medium text-amber-100">
                Инструменты разработчика
              </summary>
              <div className="mt-4">
                <APITester />
              </div>
            </details>
          </section>
        </div>
      </main>
    </div>
  );
}
