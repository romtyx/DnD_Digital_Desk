import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { apiService, type Campaign } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DeskLayout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedCampaignId = searchParams.get("campaign")
    ? Number(searchParams.get("campaign"))
    : null;

  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  useEffect(() => {
    if (campaigns.length === 0) {
      return;
    }
    if (!selectedCampaignId || !campaigns.some((item) => item.id === selectedCampaignId)) {
      setSearchParams({ campaign: String(campaigns[0].id) });
    }
  }, [campaigns, selectedCampaignId, setSearchParams]);

  const refreshCampaigns = async () => {
    const list = await apiService.listCampaigns();
    setCampaigns(list);
    if (!selectedCampaignId && list.length > 0) {
      setSearchParams({ campaign: String(list[0].id) });
    }
  };

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        await refreshCampaigns();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleSelectCampaign = (campaignId: number) => {
    setSearchParams({ campaign: String(campaignId) });
  };

  return (
    <div className="page-shell min-h-screen">
      <header className="container mx-auto px-6 pt-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl border border-amber-500/40 bg-amber-200/10 text-amber-100 flex items-center justify-center shadow-sm font-display">
            DD
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-100/60">
              Кабинет мастера
            </p>
            <p className="text-sm text-amber-100/80">
              {selectedCampaign?.name || "Выбери кампанию"}
            </p>
          </div>
        </Link>
        <Button
          variant="outline"
          onClick={() => {
            apiService.logout();
            navigate("/login");
          }}
        >
          Выйти
        </Button>
      </header>

      <div className="container mx-auto px-6 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-4">
          <Card className="pixel-panel p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-100/60">
              Кампании
            </p>
            <div className="mt-3 space-y-2">
              {loading && <p className="text-sm text-amber-100/70">Загрузка...</p>}
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => handleSelectCampaign(campaign.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    campaign.id === selectedCampaignId
                      ? "border-amber-400/70 bg-amber-800/40"
                      : "border-amber-700/30 bg-amber-950/40"
                  }`}
                >
                  <p className="font-medium text-amber-100">{campaign.name}</p>
                  <p className="text-amber-100/60 text-xs">{campaign.description || "Без описания"}</p>
                </button>
              ))}
              {campaigns.length === 0 && (
                <p className="text-sm text-amber-100/70">Создай первую кампанию.</p>
              )}
            </div>
            <Button
              className="w-full mt-3"
              onClick={() => navigate("/desk/campaigns")}
            >
              Управление
            </Button>
          </Card>

          <Card className="pixel-panel p-3">
            <nav className="flex flex-col gap-2 text-sm">
              {[
                { to: "/desk/campaigns", label: "Кампании" },
                { to: "/desk/sessions", label: "Сессии" },
                { to: "/desk/notes", label: "Заметки мастера" },
                { to: "/desk/storyline", label: "Линия сюжета" },
                { to: "/desk/characters", label: "Персонажи" },
                { to: "/desk/chat", label: "Чат" },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to + (selectedCampaignId ? `?campaign=${selectedCampaignId}` : "")}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 border ${
                      isActive
                        ? "border-amber-400/70 bg-amber-800/40 text-amber-100"
                        : "border-transparent text-amber-100/70 hover:text-amber-100"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </Card>
        </aside>

        <section>
          <Outlet context={{ selectedCampaignId, refreshCampaigns }} />
        </section>
      </div>
    </div>
  );
}
