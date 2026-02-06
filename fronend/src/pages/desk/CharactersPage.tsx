import { useEffect, useState } from "react";
import { apiService, type CharacterSheet } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const defaultDraft = {
  name: "",
  player_name: "",
  character_class_text: "",
  level: 1,
  race: "",
  background: "",
  alignment: "",
  experience_points: 0,
  strength: 10,
  strength_mod: 0,
  dexterity: 10,
  dexterity_mod: 0,
  constitution: 10,
  constitution_mod: 0,
  intelligence: 10,
  intelligence_mod: 0,
  wisdom: 10,
  wisdom_mod: 0,
  charisma: 10,
  charisma_mod: 0,
  saving_throw_strength: 0,
  saving_throw_strength_prof: false,
  saving_throw_dexterity: 0,
  saving_throw_dexterity_prof: false,
  saving_throw_constitution: 0,
  saving_throw_constitution_prof: false,
  saving_throw_intelligence: 0,
  saving_throw_intelligence_prof: false,
  saving_throw_wisdom: 0,
  saving_throw_wisdom_prof: false,
  saving_throw_charisma: 0,
  saving_throw_charisma_prof: false,
  skill_acrobatics: 0,
  skill_acrobatics_prof: false,
  skill_animal_handling: 0,
  skill_animal_handling_prof: false,
  skill_arcana: 0,
  skill_arcana_prof: false,
  skill_athletics: 0,
  skill_athletics_prof: false,
  skill_deception: 0,
  skill_deception_prof: false,
  skill_history: 0,
  skill_history_prof: false,
  skill_insight: 0,
  skill_insight_prof: false,
  skill_intimidation: 0,
  skill_intimidation_prof: false,
  skill_investigation: 0,
  skill_investigation_prof: false,
  skill_medicine: 0,
  skill_medicine_prof: false,
  skill_nature: 0,
  skill_nature_prof: false,
  skill_perception: 0,
  skill_perception_prof: false,
  skill_performance: 0,
  skill_performance_prof: false,
  skill_persuasion: 0,
  skill_persuasion_prof: false,
  skill_religion: 0,
  skill_religion_prof: false,
  skill_sleight_of_hand: 0,
  skill_sleight_of_hand_prof: false,
  skill_stealth: 0,
  skill_stealth_prof: false,
  skill_survival: 0,
  skill_survival_prof: false,
  max_hit_points: 10,
  current_hit_points: 10,
  temporary_hit_points: 0,
  armor_class: 10,
  initiative: 0,
  speed: 30,
  inspiration: false,
  proficiency_bonus: 2,
  passive_perception: 10,
  hit_dice_total: 0,
  hit_dice_used: 0,
  hit_dice_type: "",
  death_save_successes: 0,
  death_save_failures: 0,
  equipment: "",
  treasure: "",
  attacks: "",
  attacks_and_spells: "",
  other_proficiencies: "",
  personality_traits: "",
  ideals: "",
  bonds: "",
  flaws: "",
  features_traits: "",
  age: "",
  height: "",
  weight: "",
  eyes: "",
  skin: "",
  hair: "",
  appearance: "",
  backstory: "",
  allies_organizations: "",
  additional_features: "",
  spellcasting_class: "",
  spellcasting_ability: "",
  spell_save_dc: 0,
  spell_attack_bonus: 0,
  spells_cantrips: "",
  spell_slots_1_total: 0,
  spell_slots_1_used: 0,
  spells_level_1: "",
  spell_slots_2_total: 0,
  spell_slots_2_used: 0,
  spells_level_2: "",
  spell_slots_3_total: 0,
  spell_slots_3_used: 0,
  spells_level_3: "",
  spell_slots_4_total: 0,
  spell_slots_4_used: 0,
  spells_level_4: "",
  spell_slots_5_total: 0,
  spell_slots_5_used: 0,
  spells_level_5: "",
  spell_slots_6_total: 0,
  spell_slots_6_used: 0,
  spells_level_6: "",
  spell_slots_7_total: 0,
  spell_slots_7_used: 0,
  spells_level_7: "",
  spell_slots_8_total: 0,
  spell_slots_8_used: 0,
  spells_level_8: "",
  spell_slots_9_total: 0,
  spell_slots_9_used: 0,
  spells_level_9: "",
};

type CharacterDraft = typeof defaultDraft;

type SkillField = {
  label: string;
  valueKey: keyof CharacterDraft;
  profKey: keyof CharacterDraft;
};

type StatField = {
  label: string;
  valueKey: keyof CharacterDraft;
  modKey?: keyof CharacterDraft;
};

const abilities: StatField[] = [
  { label: "Сила", valueKey: "strength", modKey: "strength_mod" },
  { label: "Ловкость", valueKey: "dexterity", modKey: "dexterity_mod" },
  { label: "Телосложение", valueKey: "constitution", modKey: "constitution_mod" },
  { label: "Интеллект", valueKey: "intelligence", modKey: "intelligence_mod" },
  { label: "Мудрость", valueKey: "wisdom", modKey: "wisdom_mod" },
  { label: "Харизма", valueKey: "charisma", modKey: "charisma_mod" },
];

const savingThrows: SkillField[] = [
  { label: "Сила", valueKey: "saving_throw_strength", profKey: "saving_throw_strength_prof" },
  { label: "Ловкость", valueKey: "saving_throw_dexterity", profKey: "saving_throw_dexterity_prof" },
  { label: "Телосложение", valueKey: "saving_throw_constitution", profKey: "saving_throw_constitution_prof" },
  { label: "Интеллект", valueKey: "saving_throw_intelligence", profKey: "saving_throw_intelligence_prof" },
  { label: "Мудрость", valueKey: "saving_throw_wisdom", profKey: "saving_throw_wisdom_prof" },
  { label: "Харизма", valueKey: "saving_throw_charisma", profKey: "saving_throw_charisma_prof" },
];

const skills: SkillField[] = [
  { label: "Акробатика (Лов)", valueKey: "skill_acrobatics", profKey: "skill_acrobatics_prof" },
  { label: "Анализ животных (Муд)", valueKey: "skill_animal_handling", profKey: "skill_animal_handling_prof" },
  { label: "Магия (Инт)", valueKey: "skill_arcana", profKey: "skill_arcana_prof" },
  { label: "Атлетика (Сил)", valueKey: "skill_athletics", profKey: "skill_athletics_prof" },
  { label: "Обман (Хар)", valueKey: "skill_deception", profKey: "skill_deception_prof" },
  { label: "История (Инт)", valueKey: "skill_history", profKey: "skill_history_prof" },
  { label: "Проницательность (Муд)", valueKey: "skill_insight", profKey: "skill_insight_prof" },
  { label: "Запугивание (Хар)", valueKey: "skill_intimidation", profKey: "skill_intimidation_prof" },
  { label: "Расследование (Инт)", valueKey: "skill_investigation", profKey: "skill_investigation_prof" },
  { label: "Медицина (Муд)", valueKey: "skill_medicine", profKey: "skill_medicine_prof" },
  { label: "Природа (Инт)", valueKey: "skill_nature", profKey: "skill_nature_prof" },
  { label: "Восприятие (Муд)", valueKey: "skill_perception", profKey: "skill_perception_prof" },
  { label: "Выступление (Хар)", valueKey: "skill_performance", profKey: "skill_performance_prof" },
  { label: "Убеждение (Хар)", valueKey: "skill_persuasion", profKey: "skill_persuasion_prof" },
  { label: "Религия (Инт)", valueKey: "skill_religion", profKey: "skill_religion_prof" },
  { label: "Ловкость рук (Лов)", valueKey: "skill_sleight_of_hand", profKey: "skill_sleight_of_hand_prof" },
  { label: "Скрытность (Лов)", valueKey: "skill_stealth", profKey: "skill_stealth_prof" },
  { label: "Выживание (Муд)", valueKey: "skill_survival", profKey: "skill_survival_prof" },
];

const spellSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterSheet[]>([]);
  const [draft, setDraft] = useState<CharacterDraft>(defaultDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appearanceFile, setAppearanceFile] = useState<File | null>(null);
  const [symbolFile, setSymbolFile] = useState<File | null>(null);
  const [appearancePreview, setAppearancePreview] = useState<string | null>(null);
  const [symbolPreview, setSymbolPreview] = useState<string | null>(null);

  const load = async () => {
    try {
      const [chars] = await Promise.all([
        apiService.listCharacters(),
      ]);
      setCharacters(chars);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить персонажей");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateDraft = (key: keyof CharacterDraft, value: CharacterDraft[keyof CharacterDraft]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const formData = new FormData();
      (Object.keys(draft) as Array<keyof CharacterDraft>).forEach((key) => {
        const value = draft[key];
        if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, String(value));
        }
      });
      if (appearanceFile) {
        formData.append("appearance_image", appearanceFile);
      }
      if (symbolFile) {
        formData.append("symbol_image", symbolFile);
      }

      if (editingId) {
        await apiService.updateCharacter(editingId, formData);
      } else {
        await apiService.createCharacter(formData);
      }

      setEditingId(null);
      setDraft({
        ...defaultDraft,
      });
      setAppearanceFile(null);
      setSymbolFile(null);
      setAppearancePreview(null);
      setSymbolPreview(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения персонажа");
    }
  };

  const handleEdit = (character: CharacterSheet) => {
    setEditingId(character.id);
    const nextDraft: CharacterDraft = { ...defaultDraft };
    (Object.keys(nextDraft) as Array<keyof CharacterDraft>).forEach((key) => {
      if (key in character) {
        nextDraft[key] = (character as any)[key] ?? nextDraft[key];
      }
    });
    nextDraft.character_class_text = character.character_class_name || "";
    setDraft(nextDraft);
    setAppearanceFile(null);
    setSymbolFile(null);
    setAppearancePreview(character.appearance_image ?? null);
    setSymbolPreview(character.symbol_image ?? null);
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card className="pixel-panel">
          <CardHeader>
            <CardTitle className="font-display text-xl text-amber-100">Персонажи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {characters.map((character) => (
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
              </div>
            ))}
            {characters.length === 0 && (
              <p className="text-sm text-amber-100/70">Персонажей пока нет.</p>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">
                {editingId ? "Редактировать персонажа" : "Новый персонаж"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          value={draft.name}
          onChange={(event) => updateDraft("name", event.target.value)}
          placeholder="Имя персонажа"
          required
        />
        <Input
          value={draft.player_name}
          onChange={(event) => updateDraft("player_name", event.target.value)}
          placeholder="Имя игрока"
        />
        <div className="space-y-2">
          <Label>Класс персонажа</Label>
          <Input
            value={draft.character_class_text}
            onChange={(event) => updateDraft("character_class_text", event.target.value)}
            placeholder="Например: Воин"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Уровень персонажа</Label>
          <Input
            type="number"
            min={1}
            value={draft.level}
            onChange={(event) => updateDraft("level", Number(event.target.value))}
            placeholder="Уровень"
          />
        </div>
        <Input
          value={draft.race}
          onChange={(event) => updateDraft("race", event.target.value)}
          placeholder="Раса"
          required
        />
                <Input
                  value={draft.background}
                  onChange={(event) => updateDraft("background", event.target.value)}
                  placeholder="Предыстория"
                />
                <Input
                  value={draft.alignment}
                  onChange={(event) => updateDraft("alignment", event.target.value)}
                  placeholder="Мировоззрение"
                />
                <Input
                  type="number"
                  min={0}
                  value={draft.experience_points}
                  onChange={(event) => updateDraft("experience_points", Number(event.target.value))}
                  placeholder="Очки опыта"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">Лист 1: Бой и навыки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {abilities.map((ability) => (
                  <div key={ability.label} className="space-y-2">
                    <Label>{ability.label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={draft[ability.valueKey] as number}
                        onChange={(event) => updateDraft(ability.valueKey, Number(event.target.value))}
                        placeholder="Значение"
                      />
                      {ability.modKey && (
                        <Input
                          type="number"
                          value={draft[ability.modKey] as number}
                          onChange={(event) => updateDraft(ability.modKey, Number(event.target.value))}
                          placeholder="Модификатор"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Спасброски</Label>
                  {savingThrows.map((save) => (
                    <div key={save.label} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft[save.profKey] as boolean}
                        onChange={(event) => updateDraft(save.profKey, event.target.checked)}
                      />
                      <span className="text-sm text-amber-100/80 flex-1">{save.label}</span>
                      <Input
                        type="number"
                        className="w-24"
                        value={draft[save.valueKey] as number}
                        onChange={(event) => updateDraft(save.valueKey, Number(event.target.value))}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-[0.3em] text-amber-100/60">Навыки</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {skills.map((skill) => (
                      <div key={skill.label} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={draft[skill.profKey] as boolean}
                          onChange={(event) => updateDraft(skill.profKey, event.target.checked)}
                        />
                        <span className="text-xs text-amber-100/80 flex-1">{skill.label}</span>
                        <Input
                          type="number"
                          className="w-16"
                          value={draft[skill.valueKey] as number}
                          onChange={(event) => updateDraft(skill.valueKey, Number(event.target.value))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Класс брони</Label>
                  <Input
                    type="number"
                    value={draft.armor_class}
                    onChange={(event) => updateDraft("armor_class", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Инициатива</Label>
                  <Input
                    type="number"
                    value={draft.initiative}
                    onChange={(event) => updateDraft("initiative", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Скорость</Label>
                  <Input
                    type="number"
                    value={draft.speed}
                    onChange={(event) => updateDraft("speed", Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>ХП максимум</Label>
                  <Input
                    type="number"
                    value={draft.max_hit_points}
                    onChange={(event) => updateDraft("max_hit_points", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ХП текущие</Label>
                  <Input
                    type="number"
                    value={draft.current_hit_points}
                    onChange={(event) => updateDraft("current_hit_points", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Временные ХП</Label>
                  <Input
                    type="number"
                    value={draft.temporary_hit_points}
                    onChange={(event) => updateDraft("temporary_hit_points", Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Кость хитов</Label>
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input
                      type="number"
                      value={draft.hit_dice_total}
                      onChange={(event) => updateDraft("hit_dice_total", Number(event.target.value))}
                      placeholder="Всего"
                    />
                    <Input
                      type="number"
                      value={draft.hit_dice_used}
                      onChange={(event) => updateDraft("hit_dice_used", Number(event.target.value))}
                      placeholder="Использовано"
                    />
                    <Input
                      value={draft.hit_dice_type}
                      onChange={(event) => updateDraft("hit_dice_type", event.target.value)}
                      placeholder="Тип (d8)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Смертельные спасброски</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={draft.death_save_successes}
                      onChange={(event) => updateDraft("death_save_successes", Number(event.target.value))}
                      placeholder="Успехи"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={draft.death_save_failures}
                      onChange={(event) => updateDraft("death_save_failures", Number(event.target.value))}
                      placeholder="Провалы"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Вдохновение</Label>
                  <label className="flex items-center gap-2 text-sm text-amber-100/80">
                    <input
                      type="checkbox"
                      checked={draft.inspiration}
                      onChange={(event) => updateDraft("inspiration", event.target.checked)}
                    />
                    Отметить вдохновение
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Бонус мастерства</Label>
                  <Input
                    type="number"
                    value={draft.proficiency_bonus}
                    onChange={(event) => updateDraft("proficiency_bonus", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пассивная мудрость (Восприятие)</Label>
                  <Input
                    type="number"
                    value={draft.passive_perception}
                    onChange={(event) => updateDraft("passive_perception", Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Textarea
                  value={draft.attacks}
                  onChange={(event) => updateDraft("attacks", event.target.value)}
                  placeholder="Атаки: название | бонус атаки | тип урона"
                />
                <Textarea
                  value={draft.attacks_and_spells}
                  onChange={(event) => updateDraft("attacks_and_spells", event.target.value)}
                  placeholder="Атаки и заклинания"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Textarea
                  value={draft.equipment}
                  onChange={(event) => updateDraft("equipment", event.target.value)}
                  placeholder="Снаряжение"
                />
                <Textarea
                  value={draft.other_proficiencies}
                  onChange={(event) => updateDraft("other_proficiencies", event.target.value)}
                  placeholder="Другие умения и языки"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Textarea
                  value={draft.personality_traits}
                  onChange={(event) => updateDraft("personality_traits", event.target.value)}
                  placeholder="Персональные черты"
                />
                <Textarea
                  value={draft.ideals}
                  onChange={(event) => updateDraft("ideals", event.target.value)}
                  placeholder="Идеалы"
                />
                <Textarea
                  value={draft.bonds}
                  onChange={(event) => updateDraft("bonds", event.target.value)}
                  placeholder="Привязанности"
                />
                <Textarea
                  value={draft.flaws}
                  onChange={(event) => updateDraft("flaws", event.target.value)}
                  placeholder="Пороки"
                />
              </div>

              <Textarea
                value={draft.features_traits}
                onChange={(event) => updateDraft("features_traits", event.target.value)}
                placeholder="Особенности и способности"
              />
            </CardContent>
          </Card>

          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">Лист 2: Внешность и история</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={draft.age}
                  onChange={(event) => updateDraft("age", event.target.value)}
                  placeholder="Возраст"
                />
                <Input
                  value={draft.height}
                  onChange={(event) => updateDraft("height", event.target.value)}
                  placeholder="Рост"
                />
                <Input
                  value={draft.weight}
                  onChange={(event) => updateDraft("weight", event.target.value)}
                  placeholder="Вес"
                />
                <Input
                  value={draft.eyes}
                  onChange={(event) => updateDraft("eyes", event.target.value)}
                  placeholder="Цвет глаз"
                />
                <Input
                  value={draft.skin}
                  onChange={(event) => updateDraft("skin", event.target.value)}
                  placeholder="Цвет кожи"
                />
                <Input
                  value={draft.hair}
                  onChange={(event) => updateDraft("hair", event.target.value)}
                  placeholder="Цвет волос"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Внешность персонажа</Label>
                  <Textarea
                    value={draft.appearance}
                    onChange={(event) => updateDraft("appearance", event.target.value)}
                    placeholder="Описание внешности"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setAppearanceFile(file);
                      if (file) {
                        setAppearancePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {appearancePreview && (
                    <img
                      src={appearancePreview}
                      alt="Внешность"
                      className="mt-2 rounded-lg border border-amber-700/30"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Символ</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSymbolFile(file);
                      if (file) {
                        setSymbolPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {symbolPreview && (
                    <img
                      src={symbolPreview}
                      alt="Символ"
                      className="mt-2 rounded-lg border border-amber-700/30"
                    />
                  )}
                  <Textarea
                    value={draft.allies_organizations}
                    onChange={(event) => updateDraft("allies_organizations", event.target.value)}
                    placeholder="Союзники и организации"
                  />
                </div>
              </div>

              <Textarea
                value={draft.backstory}
                onChange={(event) => updateDraft("backstory", event.target.value)}
                placeholder="Предыстория персонажа"
              />

              <Textarea
                value={draft.additional_features}
                onChange={(event) => updateDraft("additional_features", event.target.value)}
                placeholder="Дополнительные особенности и черты"
              />

              <Textarea
                value={draft.treasure}
                onChange={(event) => updateDraft("treasure", event.target.value)}
                placeholder="Сокровища"
              />
            </CardContent>
          </Card>

          <Card className="pixel-panel">
            <CardHeader>
              <CardTitle className="font-display text-xl text-amber-100">Лист 3: Заклинания</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={draft.spellcasting_class}
                  onChange={(event) => updateDraft("spellcasting_class", event.target.value)}
                  placeholder="Класс заклинателя"
                />
                <Input
                  value={draft.spellcasting_ability}
                  onChange={(event) => updateDraft("spellcasting_ability", event.target.value)}
                  placeholder="Характеристика заклинателя"
                />
                <Input
                  type="number"
                  value={draft.spell_save_dc}
                  onChange={(event) => updateDraft("spell_save_dc", Number(event.target.value))}
                  placeholder="Сл спасброска"
                />
                <Input
                  type="number"
                  value={draft.spell_attack_bonus}
                  onChange={(event) => updateDraft("spell_attack_bonus", Number(event.target.value))}
                  placeholder="Бонус атаки"
                />
              </div>

              <Textarea
                value={draft.spells_cantrips}
                onChange={(event) => updateDraft("spells_cantrips", event.target.value)}
                placeholder="Заговоры (уровень 0)"
              />

              {spellSlots.map((level) => (
                <div key={level} className="space-y-2">
                  <Label>Заклинания уровня {level}</Label>
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input
                      type="number"
                      min={0}
                      value={draft[`spell_slots_${level}_total` as keyof CharacterDraft] as number}
                      onChange={(event) =>
                        updateDraft(
                          `spell_slots_${level}_total` as keyof CharacterDraft,
                          Number(event.target.value),
                        )
                      }
                      placeholder="Всего"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={draft[`spell_slots_${level}_used` as keyof CharacterDraft] as number}
                      onChange={(event) =>
                        updateDraft(
                          `spell_slots_${level}_used` as keyof CharacterDraft,
                          Number(event.target.value),
                        )
                      }
                      placeholder="Использовано"
                    />
                  </div>
                  <Textarea
                    value={draft[`spells_level_${level}` as keyof CharacterDraft] as string}
                    onChange={(event) =>
                      updateDraft(`spells_level_${level}` as keyof CharacterDraft, event.target.value)
                    }
                    placeholder={`Список заклинаний уровня ${level}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Сохранить" : "Создать"}</Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setDraft({
                    ...defaultDraft,
                  });
                  setAppearanceFile(null);
                  setSymbolFile(null);
                  setAppearancePreview(null);
                  setSymbolPreview(null);
                }}
              >
                Отмена
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
