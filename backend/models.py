from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField


# 
# Классы
# 
class Class(models.Model):
    """Модель для классов персонажей"""
    name = models.CharField(max_length=100, verbose_name="Название класса")
    hit_die = models.IntegerField(verbose_name="Кость хитов", null=True)
    
    class Meta:
        verbose_name = "Класс"
        verbose_name_plural = "Классы"
    
    def __str__(self):
        return self.name

class Subclass(models.Model):
    """Модель для подклассов"""
    name = models.CharField(max_length=100, verbose_name="Название подкласса")
    parent_class = models.ForeignKey(
        Class, 
        on_delete=models.CASCADE, 
        related_name='subclasses',
        verbose_name="Родительский класс"
    )

    class Meta:
        verbose_name = "Подкласс"
        verbose_name_plural = "Подклассы"
    
    def __str__(self):
        return self.name

# 
# Заклинания
#

class AreaOfEffect(models.Model):
    """Модель для области эффекта заклинания"""
    type = models.CharField(max_length=100, verbose_name="Тип области")
    size = models.IntegerField(verbose_name="Размер")
    
    class Meta:
        verbose_name = "Область эффекта"
        verbose_name_plural = "Области эффекта"
    
    def __str__(self):
        return f"{self.type} ({self.size})"


class DamageType(models.Model):
    """Модель для типов урона"""
    name = models.CharField(max_length=100, verbose_name="Название типа урона")
    
    class Meta:
        verbose_name = "Тип урона"
        verbose_name_plural = "Типы урона"
    
    def __str__(self):
        return self.name

class MagicSchool(models.Model):
    """Модель для школ магии"""
    name = models.CharField(max_length=100, verbose_name="Название школы")
    desc = models.TextField(verbose_name="Описание", blank=True)
    
    class Meta:
        verbose_name = "Школа магии"
        verbose_name_plural = "Школы магии"
    
    def __str__(self):
        return self.name

class SpellDamage(models.Model):
    """Детали урона от заклинания"""
    damage_type = models.ForeignKey(
        DamageType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Тип урона",
        help_text="Тип урона, который наносит заклинание (огонь, холод, яд и т.д.)"
    )
    
    damage_at_slot_level = JSONField(
        null=True, 
        blank=True,
        verbose_name="Урон по уровням слотов",
        help_text="Словарь, где ключ - уровень слота заклинания, значение - формула урона. Например: {\"1\": \"2d6\", \"2\": \"3d6\"}"
    )
    
    damage_at_character_level = JSONField(
        null=True, 
        blank=True,
        verbose_name="Урон по уровням персонажа",
        help_text="Словарь, где ключ - уровень персонажа, значение - формула урона. Например: {\"5\": \"3d8\", \"10\": \"4d8\"}"
    )
    
    class Meta:
        verbose_name = "Урон заклинания"
        verbose_name_plural = "Уроны заклинаний"
    
    def __str__(self):
        return f"Урон для заклинания"

class SpellDC(models.Model):
    """Детали спасброска от заклинания"""
    dc_type = models.ForeignKey(
        AbilityScore,
        on_delete=models.CASCADE,
        verbose_name="Тип спасброска",
        help_text="Характеристика, используемая для спасброска против заклинания"
    )
    
    DC_SUCCESS_CHOICES = [
        ('half', 'Половина урона'),
        ('none', 'Нет эффекта'),
        ('full', 'Полный эффект'),
        ('quarter', 'Четверть урона'),
    ]
    
    dc_success = models.CharField(
        max_length=20,
        choices=DC_SUCCESS_CHOICES,
        verbose_name="Результат успешного спасброска",
        help_text="Что происходит при успешном спасброске: половина урона, нет эффекта и т.д."
    )
    
    desc = models.TextField(
        null=True, 
        blank=True,
        verbose_name="Дополнительное описание",
        help_text="Дополнительные детали о спасброске против этого заклинания"
    )
    
    class Meta:
        verbose_name = "Спасбросок заклинания"
        verbose_name_plural = "Спасброски заклинаний"
        indexes = [
            models.Index(fields=['dc_success']),
        ]
    
    def __str__(self):
        return f"Спасбросок: {self.dc_success} ({self.dc_type.name})"

class Spell(models.Model):
    """Основная модель заклинания для Dungeons & Dragons"""
    
    name = models.CharField(
        max_length=255,
        verbose_name="Название",
        help_text="Полное название заклинания"
    )
    
    index = models.SlugField(
        unique=True,
        verbose_name="Индекс",
        help_text="Уникальный идентификатор заклинания"
    )
    
    level = models.PositiveSmallIntegerField(
        verbose_name="Уровень",
        help_text="Уровень заклинания (0 для заклинаний нулевого круга/заговоров)"
    )
    
    casting_time = models.CharField(
        max_length=100,
        verbose_name="Время накладывания",
        help_text="Сколько времени требуется для накладывания заклинания (1 действие, 1 минута, 8 часов и т.д.)"
    )
    
    duration = models.CharField(
        max_length=100,
        verbose_name="Длительность",
        help_text="Как долго действует заклинание (мгновенно, 1 минута, до рассеивания и т.д.)"
    )
    
    range = models.CharField(
        max_length=100,
        verbose_name="Дистанция",
        help_text="На каком расстоянии можно наложить заклинание (дотягиваемся, 30 футов, 1 миля и т.д.)"
    )
    
    components = ArrayField(
        models.CharField(max_length=10),
        verbose_name="Компоненты",
        help_text="Необходимые компоненты для накладывания: V (вербальный), S (соматический), M (материальный)"
    )
    
    ritual = models.BooleanField(
        default=False,
        verbose_name="Ритуал",
        help_text="Можно ли наложить это заклинание как ритуал (без расхода слота заклинания)"
    )
    
    concentration = models.BooleanField(
        default=False,
        verbose_name="Концентрация",
        help_text="Требует ли заклинание концентрации для поддержания эффекта"
    )
    
    desc = ArrayField(
        models.TextField(),
        verbose_name="Описание",
        help_text="Основное описание эффектов заклинания, каждая строка - отдельный абзац"
    )
    
    higher_level = ArrayField(
        models.TextField(),
        null=True,
        blank=True,
        verbose_name="Эффекты на более высоких уровнях",
        help_text="Дополнительные эффекты или усиления при наложении заклинания с использованием слотов более высокого уровня"
    )
    
    material = models.TextField(
        null=True,
        blank=True,
        verbose_name="Материальные компоненты",
        help_text="Описание специфических материальных компонентов, если они требуются и имеют особую ценность или свойства"
    )
    
    attack_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="Тип атаки",
        help_text="Тип атаки, если заклинание требует броска атаки (ближняя, дальнобойная и т.д.)"
    )
    
    area_of_effect = models.ForeignKey(
        AreaOfEffect,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Область эффекта",
        help_text="Детали области, на которую распространяется действие заклинания (конус, сфера, куб и т.д.)"
    )
    
    school = models.ForeignKey(
        MagicSchool,
        on_delete=models.CASCADE,
        verbose_name="Школа магии",
        help_text="Школа магии, к которой принадлежит заклинание (очарование, иллюзия, разрушение и т.д.)"
    )
    
    damage = models.OneToOneField(
        SpellDamage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Урон",
        help_text="Детали урона, наносимого заклинанием, включая тип урона и формулы по уровням"
    )
    
    dc = models.OneToOneField(
        SpellDC,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Спасбросок",
        help_text="Детали спасброска, который должны совершать цели для сопротивления эффектам заклинания"
    )
    
    classes = models.ManyToManyField(
        Class,
        related_name='spells',
        verbose_name="Классы",
        help_text="Классы персонажей, которые могут изучать и использовать это заклинание"
    )
    
    subclasses = models.ManyToManyField(
        Subclass,
        related_name='spells',
        blank=True,
        verbose_name="Подклассы",
        help_text="Подклассы, которые получают доступ к этому заклинанию (если применимо)"
    )
    
    heal_at_slot_level = JSONField(
        null=True,
        blank=True,
        verbose_name="Исцеление по уровням слотов",
        help_text="Словарь, где ключ - уровень слота заклинания, значение - формула исцеления. Например: {\"1\": \"2d4\", \"2\": \"3d4\"}"
    )
    
    class Meta:
        verbose_name = "Заклинание"
        verbose_name_plural = "Заклинания"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['level']),
            models.Index(fields=['index']),
            models.Index(fields=['casting_time']),
            models.Index(fields=['duration']),
            models.Index(fields=['range']),
            models.Index(fields=['ritual']),
        ]
        ordering = ['name', 'level']
        db_table = 'dnd_spells'
    
    def __str__(self):
        return f"{self.name} (уровень {self.level}): {self.desc}"


# 
# Лист персонажа
# 
class CharacterSheet(models.Model):
    '''Лист персонажа'''
    name = models.CharField(max_length=100)
    character_class = models.OneToOneField(Class)
    level = models.IntegerField(default=1)
    race = models.CharField(max_length=50)
    background = models.CharField(max_length=50, blank=True)
    
    strength = models.IntegerField(default=10)
    dexterity = models.IntegerField(default=10)
    constitution = models.IntegerField(default=10)
    intelligence = models.IntegerField(default=10)
    wisdom = models.IntegerField(default=10)
    charisma = models.IntegerField(default=10)
    
    max_hit_points = models.IntegerField(default=10)
    current_hit_points = models.IntegerField(default=10)
    armor_class = models.IntegerField(default=10)
    speed = models.IntegerField(default=30)
    
    inspiration = models.BooleanField(default=False)
    
    skills = models.TextField(blank=True)
    equipment = models.TextField(blank=True)
    spells = models.TextField(blank=True)


    def __str__(self):
        return f"{self.name} - {self.character_class} lvl {self.level}"
    
class User(models.Model):
    name = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    email = models.CharField(max_length=100)
    desc = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
    
    def __str__(self):
        return self.name
    
class Player(models.Model):
    user = models.ManyToOneRel(User)
    character = models.ManyToOneRel(CharacterSheet)
    class Meta:
        verbose_name = "Игрок"
        verbose_name_plural = "Игроки"
    
    def __str__(self):
        return self.name
    
class session(models.Model):
    number = models.IntegerField()
    date = models.DateTimeField(_(""), auto_now=False, auto_now_add=False)()
    description = models.IntegerField()
    class Meta:
        verbose_name = "Сессия"
        verbose_name_plural = "Сессии"
    
    def __str__(self):
        return self.name

class DMnote(models.Model):
    text = models.CharField()
    session = models.ManyToOneRel()
        
    class Meta:
        verbose_name = "Записка мастера"
        verbose_name_plural = "Записи мастера"
    
    def __str__(self):
        return self.name