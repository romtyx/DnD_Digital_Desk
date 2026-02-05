from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import (
    Campaign,
    Session,
    DMNote,
    Class,
    CharacterSheet,
    CampaignNote,
    Storyline,
    StoryOutcome,
    ChatMessage,
)


class Command(BaseCommand):
    help = "Seed demo data for quick testing."

    def handle(self, *args, **options):
        User = get_user_model()
        default_classes = [
            ("Воин", 10),
            ("Маг", 6),
            ("Плут", 8),
            ("Жрец", 8),
            ("Бард", 8),
        ]
        for name, hit_die in default_classes:
            Class.objects.get_or_create(name=name, defaults={"hit_die": hit_die})

        if Campaign.objects.exists():
            self.stdout.write(self.style.WARNING("Campaigns already exist. Skipping seed."))
            return

        owner = User.objects.first()
        campaign = Campaign.objects.create(
            name="Приключение в Штормграде",
            description="Демо‑кампания для быстрых проверок.",
            world_story="Герои отправляются в древние руины у моря.",
            owner=owner,
            is_public=True,
            max_players=4,
        )

        session1 = Session.objects.create(
            number=1,
            date=timezone.now(),
            description="Знакомство с городом и слухами.",
            campaign=campaign,
        )
        session2 = Session.objects.create(
            number=2,
            date=timezone.now() + timezone.timedelta(days=7),
            description="Поход в руины и первая битва.",
            campaign=campaign,
        )

        DMNote.objects.create(
            text="Подготовить карту порта и NPC торговца.",
            session=session1,
        )
        DMNote.objects.create(
            text="В руинах спрятан ключ к древнему храму.",
            session=session2,
        )

        fighter = Class.objects.filter(name="Воин").first()
        wizard = Class.objects.filter(name="Маг").first()
        if fighter:
            fighter_sheet = CharacterSheet.objects.create(
                name="Рейн Харден",
                character_class=fighter,
                level=3,
                race="Человек",
                background="Наемник",
                owner=owner,
                strength=16,
                dexterity=12,
                constitution=14,
                intelligence=10,
                wisdom=11,
                charisma=13,
                max_hit_points=28,
                current_hit_points=28,
                armor_class=16,
                speed=30,
                equipment="Двуручный меч, кольчуга, дорожный набор",
            )
            campaign.characters.add(fighter_sheet)
        if wizard:
            wizard_sheet = CharacterSheet.objects.create(
                name="Лира Мун",
                character_class=wizard,
                level=3,
                race="Эльф",
                background="Ученик арканиста",
                owner=owner,
                intelligence=16,
                wisdom=12,
                charisma=10,
                max_hit_points=18,
                current_hit_points=18,
                armor_class=12,
                speed=30,
                spells="Magic Missile, Shield, Detect Magic",
            )
            campaign.characters.add(wizard_sheet)

        CampaignNote.objects.create(
            campaign=campaign,
            text="Обновить список NPC в порту и подготовить карту таверны.",
        )

        storyline = Storyline.objects.create(
            campaign=campaign,
            title="Слухи в таверне",
            summary="Игроки узнают о пропавшей экспедиции и решают, как действовать.",
            order=1,
        )
        StoryOutcome.objects.create(
            storyline=storyline,
            title="Игроки идут в порт",
            condition="Если они доверяют капитану",
            description="Капитан выдаёт карту и просит вернуть артефакт.",
            order=1,
        )
        StoryOutcome.objects.create(
            storyline=storyline,
            title="Игроки остаются в таверне",
            condition="Если они сомневаются",
            description="В таверне происходит драка с наёмниками.",
            order=2,
        )

        first_user = User.objects.first()
        if first_user:
            ChatMessage.objects.create(
                campaign=campaign,
                user=first_user,
                text="Добро пожаловать в Штормград! Встречаемся сегодня вечером.",
            )

        self.stdout.write(self.style.SUCCESS("Demo data created."))
